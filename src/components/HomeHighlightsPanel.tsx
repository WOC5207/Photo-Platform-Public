import { Link } from "@/i18n/navigation";

export interface HighlightPhoto {
  id: string;
  url: string;
}

export interface HighlightEventGroup {
  slug: string;
  title: string;
  dateLabel: string | null;
  photos: HighlightPhoto[];
}

export interface HighlightAnnouncement {
  id: string;
  title: string;
  body: string;
}

export interface HomeHighlightsLabels {
  announcementsHeading: string;
  highlightsHeading: string;
  noHighlightEvents: string;
}

/**
 * Homepage panel: admin announcements pinned at the top (shown only when
 * there are any — not an empty placeholder that's always there), followed
 * by event highlights grouped per event, each its own small heading + photo
 * strip. No interactivity here anymore (search moved out to HomeSearchBox,
 * and there's no tab to switch — announcements are always visible rather
 * than something you navigate to), so this can be a plain server component.
 */
export default function HomeHighlightsPanel({
  events,
  announcements,
  labels
}: {
  events: HighlightEventGroup[];
  announcements: HighlightAnnouncement[];
  labels: HomeHighlightsLabels;
}) {
  return (
    <section className="flex flex-col gap-8 overflow-hidden rounded-2xl border border-fg/10 bg-page/85 p-6 sm:p-8">
      {announcements.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">{labels.announcementsHeading}</h2>
          <ul className="flex flex-col gap-3">
            {announcements.map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-fg/10 bg-surface p-3"
              >
                <p className="font-semibold">{a.title}</p>
                {a.body && (
                  <p className="mt-1 whitespace-pre-line text-sm text-fg-subtle">
                    {a.body}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-6">
        <h2 className="text-lg font-bold">{labels.highlightsHeading}</h2>
        {events.length > 0 ? (
          events.map((event) => (
            <div key={event.slug} className="flex flex-col gap-3">
              <Link
                href={`/gallery/${event.slug}`}
                className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 hover:underline"
              >
                <span className="font-semibold">{event.title}</span>
                {event.dateLabel && (
                  <span className="shrink-0 text-xs text-fg-subtle">
                    {event.dateLabel}
                  </span>
                )}
              </Link>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {event.photos.map((photo) => (
                  <li key={photo.id}>
                    <Link
                      href={`/gallery/${event.slug}`}
                      className="group block aspect-square overflow-hidden rounded-xl bg-surface"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p className="text-sm text-fg-subtle">{labels.noHighlightEvents}</p>
        )}
      </div>
    </section>
  );
}
