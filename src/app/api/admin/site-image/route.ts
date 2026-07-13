import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { config } from "@/lib/config";
import { SITE_SETTINGS_ID } from "@/lib/settings";
import {
  ALLOWED_UPLOAD_TYPES,
  processAndStoreSiteImage,
  deleteSiteImageFile,
  siteImageUrl,
  type SiteImageOptions
} from "@/lib/images";

// Per-kind processing + which settings column the token is stored in.
const KINDS: Record<"background" | "logo" | "contactQr", SiteImageOptions> = {
  background: { prefix: "bg", maxWidth: 2560, maxHeight: 2560, quality: 82 },
  logo: { prefix: "logo", maxWidth: 512, maxHeight: 512, quality: 90 },
  contactQr: { prefix: "qr", maxWidth: 800, maxHeight: 800, quality: 90 }
};

const COLUMN: Record<keyof typeof KINDS, "backgroundImage" | "logo" | "contactQrImage"> = {
  background: "backgroundImage",
  logo: "logo",
  contactQr: "contactQrImage"
};

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const kind = form.get("kind");
  const file = form.get("file");

  if (kind !== "background" && kind !== "logo" && kind !== "contactQr") {
    return NextResponse.json({ error: "badRequest" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "badRequest" }, { status: 400 });
  }
  if (!ALLOWED_UPLOAD_TYPES[file.type]) {
    return NextResponse.json({ error: "unsupportedType" }, { status: 415 });
  }
  if (file.size > config.uploadMaxBytes()) {
    return NextResponse.json({ error: "tooLarge" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let token: string;
  try {
    token = await processAndStoreSiteImage(buffer, KINDS[kind]);
  } catch {
    return NextResponse.json({ error: "invalidImage" }, { status: 400 });
  }

  const column = COLUMN[kind];
  const previous = await prisma.siteSettings.findUnique({
    where: { id: SITE_SETTINGS_ID },
    select: { backgroundImage: true, logo: true, contactQrImage: true }
  });
  const previousToken = previous?.[column];

  const next = { [column]: token };
  await prisma.siteSettings.upsert({
    where: { id: SITE_SETTINGS_ID },
    create: { id: SITE_SETTINGS_ID, ...next },
    update: next
  });

  // Remove the file the token replaced (best-effort).
  if (previousToken) await deleteSiteImageFile(previousToken);

  return NextResponse.json({ token, url: siteImageUrl(token) });
}
