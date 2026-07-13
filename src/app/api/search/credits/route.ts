import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { photoUrls } from "@/lib/images";

const MAX_RESULTS = 8;

export interface CreditSearchResult {
  photoId: string;
  eventSlug: string;
  eventTitleEn: string;
  eventTitleZh: string;
  creditName: string;
  subject: string;
  thumbUrl: string;
}

/**
 * Public search over the credited-person/character info admins enter per
 * photo (PhotoCredit.creditName/subject) — e.g. a cosplayer looking for
 * their own photos, or a visitor looking for a specific character. Only
 * matches photos on published events; unpublished events' credits never
 * surface here.
 */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
  if (q.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const credits = await prisma.photoCredit.findMany({
    where: {
      OR: [{ creditName: { contains: q } }, { subject: { contains: q } }],
      photo: { event: { published: true } }
    },
    take: MAX_RESULTS,
    orderBy: { photo: { createdAt: "desc" } },
    include: {
      photo: {
        select: {
          id: true,
          eventId: true,
          event: { select: { slug: true, titleEn: true, titleZh: true } }
        }
      }
    }
  });

  const results: CreditSearchResult[] = credits.map((c) => ({
    photoId: c.photo.id,
    eventSlug: c.photo.event.slug,
    eventTitleEn: c.photo.event.titleEn,
    eventTitleZh: c.photo.event.titleZh,
    creditName: c.creditName,
    subject: c.subject,
    thumbUrl: photoUrls(c.photo.eventId, c.photo.id).thumb
  }));

  return NextResponse.json({ results });
}
