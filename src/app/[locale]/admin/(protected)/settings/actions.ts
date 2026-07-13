"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isAdmin, requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SITE_SETTINGS_ID } from "@/lib/settings";
import { deleteSiteImageFile } from "@/lib/images";

export type SiteSettingsState = { error?: "validation"; ok?: boolean };

async function guard(): Promise<void> {
  const locale = await getLocale();
  await requireAdmin(locale);
}

const settingsSchema = z.object({
  siteTitleEn: z.string().trim().max(120),
  siteTitleZh: z.string().trim().max(120),
  homeTitleEn: z.string().trim().max(200),
  homeTitleZh: z.string().trim().max(200),
  homeSubtitleEn: z.string().trim().max(300),
  homeSubtitleZh: z.string().trim().max(300),
  creditTermEn: z.string().trim().max(60),
  creditTermZh: z.string().trim().max(60),
  subjectTermEn: z.string().trim().max(60),
  subjectTermZh: z.string().trim().max(60),
  // Empty (theme default) or a #rgb / #rrggbb hex color.
  backgroundColor: z
    .string()
    .trim()
    .regex(/^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}))?$/),
  bookingEnabled: z.boolean(),
  lotteryEnabled: z.boolean(),
  creditProfilesEnabled: z.boolean(),
  contactEnabled: z.boolean(),
  contactTitleEn: z.string().trim().max(120),
  contactTitleZh: z.string().trim().max(120),
  contactUrlEn: z.string().trim().max(500),
  contactUrlZh: z.string().trim().max(500)
});

export async function updateSiteSettings(
  _prev: SiteSettingsState,
  formData: FormData
): Promise<SiteSettingsState> {
  await guard();

  const parsed = settingsSchema.safeParse({
    siteTitleEn: formData.get("siteTitleEn") ?? "",
    siteTitleZh: formData.get("siteTitleZh") ?? "",
    homeTitleEn: formData.get("homeTitleEn") ?? "",
    homeTitleZh: formData.get("homeTitleZh") ?? "",
    homeSubtitleEn: formData.get("homeSubtitleEn") ?? "",
    homeSubtitleZh: formData.get("homeSubtitleZh") ?? "",
    creditTermEn: formData.get("creditTermEn") ?? "",
    creditTermZh: formData.get("creditTermZh") ?? "",
    subjectTermEn: formData.get("subjectTermEn") ?? "",
    subjectTermZh: formData.get("subjectTermZh") ?? "",
    backgroundColor: formData.get("backgroundColor") ?? "",
    bookingEnabled: formData.get("bookingEnabled") === "on",
    lotteryEnabled: formData.get("lotteryEnabled") === "on",
    creditProfilesEnabled: formData.get("creditProfilesEnabled") === "on",
    contactEnabled: formData.get("contactEnabled") === "on",
    contactTitleEn: formData.get("contactTitleEn") ?? "",
    contactTitleZh: formData.get("contactTitleZh") ?? "",
    contactUrlEn: formData.get("contactUrlEn") ?? "",
    contactUrlZh: formData.get("contactUrlZh") ?? ""
  });
  if (!parsed.success) return { error: "validation" };
  const d = parsed.data;

  await prisma.siteSettings.upsert({
    where: { id: SITE_SETTINGS_ID },
    create: {
      id: SITE_SETTINGS_ID,
      siteTitleEn: d.siteTitleEn,
      siteTitleZh: d.siteTitleZh,
      homeTitleEn: d.homeTitleEn,
      homeTitleZh: d.homeTitleZh,
      homeSubtitleEn: d.homeSubtitleEn,
      homeSubtitleZh: d.homeSubtitleZh,
      creditTermEn: d.creditTermEn,
      creditTermZh: d.creditTermZh,
      subjectTermEn: d.subjectTermEn,
      subjectTermZh: d.subjectTermZh,
      backgroundColor: d.backgroundColor,
      bookingEnabled: d.bookingEnabled,
      lotteryEnabled: d.lotteryEnabled,
      creditProfilesEnabled: d.creditProfilesEnabled,
      contactEnabled: d.contactEnabled,
      contactTitleEn: d.contactTitleEn,
      contactTitleZh: d.contactTitleZh,
      contactUrlEn: d.contactUrlEn,
      contactUrlZh: d.contactUrlZh
    },
    update: {
      siteTitleEn: d.siteTitleEn,
      siteTitleZh: d.siteTitleZh,
      homeTitleEn: d.homeTitleEn,
      homeTitleZh: d.homeTitleZh,
      homeSubtitleEn: d.homeSubtitleEn,
      homeSubtitleZh: d.homeSubtitleZh,
      creditTermEn: d.creditTermEn,
      creditTermZh: d.creditTermZh,
      subjectTermEn: d.subjectTermEn,
      subjectTermZh: d.subjectTermZh,
      backgroundColor: d.backgroundColor,
      bookingEnabled: d.bookingEnabled,
      lotteryEnabled: d.lotteryEnabled,
      creditProfilesEnabled: d.creditProfilesEnabled,
      contactEnabled: d.contactEnabled,
      contactTitleEn: d.contactTitleEn,
      contactTitleZh: d.contactTitleZh,
      contactUrlEn: d.contactUrlEn,
      contactUrlZh: d.contactUrlZh
    }
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export type PersonalLinkState = { error?: "validation"; ok?: boolean };

const personalLinkSchema = z.object({
  labelEn: z.string().trim().max(200),
  labelZh: z.string().trim().max(200),
  url: z.string().trim().min(1).max(500)
});

function parsePersonalLinkForm(formData: FormData) {
  return personalLinkSchema.safeParse({
    labelEn: formData.get("labelEn") ?? "",
    labelZh: formData.get("labelZh") ?? "",
    url: formData.get("url") ?? ""
  });
}

export async function addPersonalLink(
  _prev: PersonalLinkState,
  formData: FormData
): Promise<PersonalLinkState> {
  await guard();
  const parsed = parsePersonalLinkForm(formData);
  if (!parsed.success) return { error: "validation" };
  const d = parsed.data;

  const maxOrder = await prisma.personalLink.aggregate({
    _max: { sortOrder: true }
  });
  await prisma.personalLink.create({
    data: {
      labelEn: d.labelEn,
      labelZh: d.labelZh,
      url: d.url,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1
    }
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updatePersonalLink(formData: FormData): Promise<void> {
  await guard();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const parsed = parsePersonalLinkForm(formData);
  if (!parsed.success) return;
  const d = parsed.data;

  await prisma.personalLink
    .update({
      where: { id },
      data: { labelEn: d.labelEn, labelZh: d.labelZh, url: d.url }
    })
    .catch(() => {});
  revalidatePath("/", "layout");
}

export async function deletePersonalLink(formData: FormData): Promise<void> {
  await guard();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await prisma.personalLink.delete({ where: { id } }).catch(() => {});
  revalidatePath("/", "layout");
}

export async function movePersonalLink(formData: FormData): Promise<void> {
  await guard();
  const id = formData.get("id");
  const direction = formData.get("direction");
  if (typeof id !== "string" || (direction !== "up" && direction !== "down"))
    return;

  await prisma.$transaction(async (tx) => {
    const links = await tx.personalLink.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true }
    });
    const index = links.findIndex((l) => l.id === id);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || swapWith < 0 || swapWith >= links.length) return;

    const order = links.map((l) => l.id);
    [order[index], order[swapWith]] = [order[swapWith], order[index]];
    for (let i = 0; i < order.length; i++) {
      await tx.personalLink.update({
        where: { id: order[i] },
        data: { sortOrder: i + 1 }
      });
    }
  });
  revalidatePath("/", "layout");
}

export type ContactMethodState = { error?: "validation"; ok?: boolean };

const contactMethodSchema = z
  .object({
    labelEn: z.string().trim().max(60),
    labelZh: z.string().trim().max(60)
  })
  .refine((d) => d.labelEn.length > 0 || d.labelZh.length > 0);

function parseContactMethodForm(formData: FormData) {
  return contactMethodSchema.safeParse({
    labelEn: formData.get("labelEn") ?? "",
    labelZh: formData.get("labelZh") ?? ""
  });
}

export async function addContactMethod(
  _prev: ContactMethodState,
  formData: FormData
): Promise<ContactMethodState> {
  await guard();
  const parsed = parseContactMethodForm(formData);
  if (!parsed.success) return { error: "validation" };
  const d = parsed.data;

  const maxOrder = await prisma.contactMethod.aggregate({
    _max: { sortOrder: true }
  });
  await prisma.contactMethod.create({
    data: {
      labelEn: d.labelEn,
      labelZh: d.labelZh,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1
    }
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateContactMethod(formData: FormData): Promise<void> {
  await guard();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const parsed = parseContactMethodForm(formData);
  if (!parsed.success) return;
  const d = parsed.data;

  await prisma.contactMethod
    .update({
      where: { id },
      data: { labelEn: d.labelEn, labelZh: d.labelZh }
    })
    .catch(() => {});
  revalidatePath("/", "layout");
}

export async function deleteContactMethod(formData: FormData): Promise<void> {
  await guard();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await prisma.contactMethod.delete({ where: { id } }).catch(() => {});
  revalidatePath("/", "layout");
}

export async function moveContactMethod(formData: FormData): Promise<void> {
  await guard();
  const id = formData.get("id");
  const direction = formData.get("direction");
  if (typeof id !== "string" || (direction !== "up" && direction !== "down"))
    return;

  await prisma.$transaction(async (tx) => {
    const methods = await tx.contactMethod.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true }
    });
    const index = methods.findIndex((m) => m.id === id);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || swapWith < 0 || swapWith >= methods.length) return;

    const order = methods.map((m) => m.id);
    [order[index], order[swapWith]] = [order[swapWith], order[index]];
    for (let i = 0; i < order.length; i++) {
      await tx.contactMethod.update({
        where: { id: order[i] },
        data: { sortOrder: i + 1 }
      });
    }
  });
  revalidatePath("/", "layout");
}

export type AnnouncementState = { error?: "validation"; ok?: boolean };

const announcementSchema = z
  .object({
    titleEn: z.string().trim().max(120),
    titleZh: z.string().trim().max(120),
    bodyEn: z.string().trim().max(2000),
    bodyZh: z.string().trim().max(2000)
  })
  .refine((d) => d.titleEn.length > 0 || d.titleZh.length > 0);

function parseAnnouncementForm(formData: FormData) {
  return announcementSchema.safeParse({
    titleEn: formData.get("titleEn") ?? "",
    titleZh: formData.get("titleZh") ?? "",
    bodyEn: formData.get("bodyEn") ?? "",
    bodyZh: formData.get("bodyZh") ?? ""
  });
}

export async function addAnnouncement(
  _prev: AnnouncementState,
  formData: FormData
): Promise<AnnouncementState> {
  await guard();
  const parsed = parseAnnouncementForm(formData);
  if (!parsed.success) return { error: "validation" };
  const d = parsed.data;

  const maxOrder = await prisma.announcement.aggregate({
    _max: { sortOrder: true }
  });
  await prisma.announcement.create({
    data: {
      titleEn: d.titleEn,
      titleZh: d.titleZh,
      bodyEn: d.bodyEn,
      bodyZh: d.bodyZh,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1
    }
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateAnnouncement(formData: FormData): Promise<void> {
  await guard();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const parsed = parseAnnouncementForm(formData);
  if (!parsed.success) return;
  const d = parsed.data;

  await prisma.announcement
    .update({
      where: { id },
      data: { titleEn: d.titleEn, titleZh: d.titleZh, bodyEn: d.bodyEn, bodyZh: d.bodyZh }
    })
    .catch(() => {});
  revalidatePath("/", "layout");
}

export async function deleteAnnouncement(formData: FormData): Promise<void> {
  await guard();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await prisma.announcement.delete({ where: { id } }).catch(() => {});
  revalidatePath("/", "layout");
}

export async function moveAnnouncement(formData: FormData): Promise<void> {
  await guard();
  const id = formData.get("id");
  const direction = formData.get("direction");
  if (typeof id !== "string" || (direction !== "up" && direction !== "down"))
    return;

  await prisma.$transaction(async (tx) => {
    const items = await tx.announcement.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true }
    });
    const index = items.findIndex((a) => a.id === id);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || swapWith < 0 || swapWith >= items.length) return;

    const order = items.map((a) => a.id);
    [order[index], order[swapWith]] = [order[swapWith], order[index]];
    for (let i = 0; i < order.length; i++) {
      await tx.announcement.update({
        where: { id: order[i] },
        data: { sortOrder: i + 1 }
      });
    }
  });
  revalidatePath("/", "layout");
}

const SITE_IMAGE_COLUMN = {
  background: "backgroundImage",
  logo: "logo",
  contactQrEn: "contactQrImageEn",
  contactQrZh: "contactQrImageZh"
} as const;

export async function removeSiteImage(
  kind: "background" | "logo" | "contactQrEn" | "contactQrZh"
): Promise<void> {
  if (!(await isAdmin())) return;

  const column = SITE_IMAGE_COLUMN[kind];
  const existing = await prisma.siteSettings.findUnique({
    where: { id: SITE_SETTINGS_ID },
    select: {
      backgroundImage: true,
      logo: true,
      contactQrImageEn: true,
      contactQrImageZh: true
    }
  });
  const token = existing?.[column];
  if (token) await deleteSiteImageFile(token);

  const cleared = { [column]: "" };
  await prisma.siteSettings.upsert({
    where: { id: SITE_SETTINGS_ID },
    create: { id: SITE_SETTINGS_ID, ...cleared },
    update: cleared
  });

  revalidatePath("/", "layout");
  const locale = await getLocale();
  redirect(`/${locale}/admin/settings`);
}
