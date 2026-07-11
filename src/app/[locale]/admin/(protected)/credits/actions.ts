"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { parseSocialLinksJson } from "@/lib/photoCredits";

async function guard(): Promise<void> {
  const locale = await getLocale();
  await requireAdmin(locale);
}

export type CreditProfileState = { error?: "validation" | "duplicate"; ok?: boolean };

const creditProfileSchema = z.object({
  creditName: z.string().trim().min(1).max(200)
});

export async function addCreditProfile(
  _prev: CreditProfileState,
  formData: FormData
): Promise<CreditProfileState> {
  await guard();
  const parsed = creditProfileSchema.safeParse({
    creditName: formData.get("creditName") ?? ""
  });
  if (!parsed.success) return { error: "validation" };

  try {
    await prisma.creditProfile.create({ data: { creditName: parsed.data.creditName } });
  } catch {
    // Unique constraint on creditName.
    return { error: "duplicate" };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Renames a credit profile and replaces their remembered social links in one
 * save. Silently no-ops on a duplicate-name rename (matching the app's
 * existing defensive style for these inline-edit forms) rather than
 * crashing the page.
 */
export async function updateCreditProfile(formData: FormData): Promise<void> {
  await guard();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const creditName = String(formData.get("creditName") ?? "").trim().slice(0, 200);
  if (!creditName) return;
  const socialLinks = parseSocialLinksJson(formData.get("socialLinksJson"));

  try {
    await prisma.$transaction([
      prisma.creditProfile.update({ where: { id }, data: { creditName } }),
      prisma.creditProfileSocialLink.deleteMany({ where: { creditProfileId: id } }),
      prisma.creditProfileSocialLink.createMany({
        data: socialLinks.map((s, i) => ({
          creditProfileId: id,
          platform: s.platform,
          url: s.url,
          sortOrder: i
        }))
      })
    ]);
  } catch {
    // Likely a duplicate creditName from the rename.
  }
  revalidatePath("/", "layout");
}

export async function deleteCreditProfile(formData: FormData): Promise<void> {
  await guard();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await prisma.creditProfile.delete({ where: { id } }).catch(() => {});
  revalidatePath("/", "layout");
}
