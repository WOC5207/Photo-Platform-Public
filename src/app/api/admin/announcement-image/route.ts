import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { config } from "@/lib/config";
import {
  ALLOWED_UPLOAD_TYPES,
  processAndStoreSiteImage,
  deleteSiteImageFile,
  siteImageUrl
} from "@/lib/images";

const IMAGE_OPTIONS = {
  prefix: "ann",
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 85
};

/**
 * Uploads an image for one Announcement row, identified by announcementId.
 * Unlike /api/admin/site-image (which always targets the single SiteSettings
 * row), this targets an arbitrary row in a list, so the id has to travel
 * with the upload instead of being implied by a fixed "kind".
 */
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const announcementId = form.get("announcementId");
  const file = form.get("file");

  if (typeof announcementId !== "string" || announcementId.length === 0) {
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

  const existing = await prisma.announcement.findUnique({
    where: { id: announcementId },
    select: { image: true }
  });
  if (!existing) {
    return NextResponse.json({ error: "notFound" }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let token: string;
  try {
    token = await processAndStoreSiteImage(buffer, IMAGE_OPTIONS);
  } catch {
    return NextResponse.json({ error: "invalidImage" }, { status: 400 });
  }

  await prisma.announcement.update({
    where: { id: announcementId },
    data: { image: token }
  });

  // Remove the file the token replaced (best-effort).
  if (existing.image) await deleteSiteImageFile(existing.image);

  return NextResponse.json({ token, url: siteImageUrl(token) });
}
