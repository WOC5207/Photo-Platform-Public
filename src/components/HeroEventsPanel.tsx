import { Link } from "@/i18n/navigation";

export interface HeroHighlightEvent {
  slug: string;
  title: string;
  dateLabel: string | null;
  photoUrl: string | null;
}

/**
 * Homepage hero: site title/subtitle/CTAs (same content the old standalone
 * hero showed) paired with a grid of event tiles using each event's cover
 * photo — the same "selected photo" every event already has via
 * coverPhotoId, so no separate homepage-highlight picker is needed.
 */
export default function HeroEventsPanel({
  title,
  subtitle,
  browseLabel,
  bookingLabel,
  bookingEnabled,
  events
}: {
  title: string;
  subtitle: string;
  browseLabel: string;
  bookingLabel: string;
  bookingEnabled: boolean;
  events: HeroHighlightEvent[];
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-fg/10 bg-page/85">
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,340px)_1fr] lg:items-center lg:gap-10">
        <div className="flex flex-col items-start gap-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="text-lg text-fg-subtle">{subtitle}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/gallery"
              className="rounded-full bg-fg px-6 py-3 text-sm font-semibold text-page transition hover:opacity-90"
            >
              {browseLabel}
            </Link>
            {bookingEnabled && (
              <Link
                href="/booking"
                className="rounded-full border border-border-strong px-6 py-3 text-sm font-semibold text-fg-muted transition hover:border-fg-faint hover:text-fg"
              >
                {bookingLabel}
              </Link>
            )}
          </div>
        </div>

        {events.length > 0 && (
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
            {events.map((event) => (
              <li key={event.slug}>
                <Link
                  href={`/gallery/${event.slug}`}
                  className="group relative block aspect-square overflow-hidden rounded-xl bg-surface"
                >
                  {event.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={event.photoUrl}
                      alt={event.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl text-fg-faint">
                      ✦
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent p-2 pt-6">
                    <p className="truncate text-xs font-semibold text-white">
                      {event.title}
                    </p>
                    {event.dateLabel && (
                      <p className="truncate text-[10px] text-white/70">
                        {event.dateLabel}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
