"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";

export interface HighlightEvent {
  slug: string;
  title: string;
  dateLabel: string | null;
  photoUrl: string | null;
}

export interface HighlightAnnouncement {
  id: string;
  title: string;
  body: string;
}

export interface HomeHighlightsLabels {
  eventsTab: string;
  announcementsTab: string;
  noEvents: string;
  noAnnouncements: string;
}

const tabCls = (active: boolean) =>
  `shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
    active
      ? "bg-fg text-page"
      : "text-fg-muted hover:bg-fg/5 hover:text-fg"
  }`;

/**
 * Homepage panel: a left-side tab switcher between event highlights and
 * admin announcements. Client-rendered for the tab state; the data itself
 * (events, announcements) is resolved server-side and passed in as plain
 * props. The search box lives in the hero above this panel, not in here —
 * see HomeSearchBox.
 */
export default function HomeHighlightsPanel({
  events,
  announcements,
  labels
}: {
  events: HighlightEvent[];
  announcements: HighlightAnnouncement[];
  labels: HomeHighlightsLabels;
}) {
  const [tab, setTab] = useState<"events" | "announcements">("events");

  return (
    <section className="overflow-hidden rounded-2xl border border-fg/10 bg-page/85">
      <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:gap-8">
        <div className="flex shrink-0 gap-2 overflow-x-auto lg:w-44 lg:flex-col lg:overflow-visible">
          <button
            type="button"
            onClick={() => setTab("events")}
            className={tabCls(tab === "events")}
          >
            {labels.eventsTab}
          </button>
          <button
            type="button"
            onClick={() => setTab("announcements")}
            className={tabCls(tab === "announcements")}
          >
            {labels.announcementsTab}
          </button>
        </div>

        <div className="min-w-0 flex-1">
          {tab === "events" &&
            (events.length > 0 ? (
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
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
            ) : (
              <p className="text-sm text-fg-subtle">{labels.noEvents}</p>
            ))}

          {tab === "announcements" &&
            (announcements.length > 0 ? (
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
            ) : (
              <p className="text-sm text-fg-subtle">{labels.noAnnouncements}</p>
            ))}
        </div>
      </div>
    </section>
  );
}
