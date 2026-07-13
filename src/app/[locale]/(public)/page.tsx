import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { pickText, formatCredits } from "@/lib/content";
import { photoUrls } from "@/lib/images";
import { formatDate, formatDateRange } from "@/lib/datetime";
import {
  getSiteSettings,
  getPersonalLinks,
  resolveHomeTitle,
  resolveHomeSubtitle,
  resolveCreditTerm
} from "@/lib/settings";
import EventPhotoStream, {
  type StreamEvent
} from "@/components/EventPhotoStream";
import HeroEventsPanel, {
  type HeroHighlightEvent
} from "@/components/HeroEventsPanel";
import BookingCalendar, {
  type CalendarSession
} from "@/components/BookingCalendar";
import QuickStats from "@/components/QuickStats";
import PersonalLinksList, {
  type PersonalLinkItem
} from "@/components/PersonalLinksList";

// Reads site settings + published events from the DB at request time (the
// DB isn't available during the Docker build), like the other public pages.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const t = await getTranslations("home");
  const tc = await getTranslations("common");
  const locale = await getLocale();
  const settings = await getSiteSettings();

  const heroTitle = resolveHomeTitle(settings, locale, t("title"));
  const heroSubtitle = resolveHomeSubtitle(settings, locale, t("subtitle"));
  const creditTerm = resolveCreditTerm(settings, locale, tc("creditTerm"));
  const creditsLabel = locale === "zh" ? creditTerm : `${creditTerm}s`;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [events, bookingEvents, personalLinks] = await Promise.all([
    prisma.event.findMany({
      where: { published: true },
      orderBy: [{ dateStart: "desc" }, { createdAt: "desc" }],
      include: {
        coverPhoto: true,
        photos: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          include: { credits: { orderBy: { sortOrder: "asc" } } }
        }
      }
    }),
    settings.bookingEnabled
      ? prisma.bookingEvent.findMany({
          where: { open: true, date: { gte: today } },
          orderBy: [{ date: "asc" }, { createdAt: "asc" }],
          include: {
            slots: {
              include: {
                _count: {
                  select: { bookings: { where: { status: "confirmed" } } }
                }
              }
            }
          }
        })
      : Promise.resolve([]),
    getPersonalLinks()
  ]);

  // Derived from the already-loaded published events rather than extra count
  // queries — cheap in memory, and one fewer round-trip on the busiest page
  // (SQLite serves us over a single connection, so queries don't parallelize).
  const siteStats = {
    photoCount: events.reduce((n, e) => n + e.photos.length, 0),
    albumCount: events.length,
    creditCount: new Set(
      events.flatMap((e) =>
        e.photos.flatMap((p) =>
          p.credits.map((c) => c.creditName).filter((cn) => cn.length > 0)
        )
      )
    ).size
  };

  const calendarSessions: CalendarSession[] = bookingEvents.map((e) => ({
    date: formatDate(e.date),
    title: pickText(locale, e.titleEn, e.titleZh),
    token: e.token,
    remaining: e.slots.reduce(
      (n, s) => n + Math.max(0, s.capacity - s._count.bookings),
      0
    )
  }));

  const personalLinkItems: PersonalLinkItem[] = personalLinks.map((l) => ({
    id: l.id,
    label: pickText(locale, l.labelEn, l.labelZh) || l.url,
    url: l.url
  }));

  const streamEvents: StreamEvent[] = events
    .filter((e) => e.photos.length > 0)
    .map((e) => ({
      slug: e.slug,
      title: pickText(locale, e.titleEn, e.titleZh),
      date: formatDateRange(e.dateStart, e.dateEnd) || null,
      location: e.location,
      photos: e.photos.map((p) => ({
        id: p.id,
        url: photoUrls(e.id, p.id).med,
        alt: formatCredits(p.credits),
        width: p.width,
        height: p.height
      }))
    }));

  // The hero panel highlights a handful of events by their admin-selected
  // cover photo (same one used on the gallery listing) rather than
  // duplicating the full per-event photo stream shown below in "Recent
  // work" — events without a resolvable photo are skipped, not shown as an
  // empty tile.
  const highlightEvents: HeroHighlightEvent[] = events
    .flatMap((e) => {
      const cover = e.coverPhoto ?? e.photos[0] ?? null;
      if (!cover) return [];
      return [
        {
          slug: e.slug,
          title: pickText(locale, e.titleEn, e.titleZh),
          dateLabel: formatDateRange(e.dateStart, e.dateEnd) || null,
          photoUrl: photoUrls(e.id, cover.id).med
        }
      ];
    })
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-8">
      <HeroEventsPanel
        title={heroTitle}
        subtitle={heroSubtitle}
        browseLabel={t("browseGallery")}
        bookingLabel={t("bookingButton")}
        bookingEnabled={settings.bookingEnabled}
        events={highlightEvents}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
        <section className="flex flex-col gap-6 rounded-2xl border border-fg/10 bg-page/85 p-6 sm:p-8">
          {streamEvents.length > 0 && (
            <>
              <h2 className="text-2xl font-bold">{t("recentWork")}</h2>
              <EventPhotoStream events={streamEvents} />
            </>
          )}
        </section>

        <aside className="order-first flex flex-col gap-6 lg:order-none">
          {settings.bookingEnabled && (
            <BookingCalendar sessions={calendarSessions} />
          )}
          <QuickStats
            stats={siteStats}
            title={t("quickStatsTitle")}
            photosLabel={t("quickStatsPhotos")}
            albumsLabel={t("quickStatsAlbums")}
            creditsLabel={creditsLabel}
          />
          <PersonalLinksList
            items={personalLinkItems}
            title={t("personalLinksTitle")}
          />
        </aside>
      </div>
    </div>
  );
}
