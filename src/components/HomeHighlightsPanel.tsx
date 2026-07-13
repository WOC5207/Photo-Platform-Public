"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { pickText, formatPhotoCredit } from "@/lib/content";
import type { CreditSearchResult } from "@/app/api/search/credits/route";

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
  searchPlaceholder: string;
  searching: string;
  noResults: string;
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
 * Homepage panel: a left-side tab switcher (event highlights / admin
 * announcements) plus a search box over the credited-person/character info
 * admins enter per photo. Client-rendered because both the tabs and the
 * search-as-you-type dropdown need interactivity; the data itself (events,
 * announcements) is resolved server-side and passed in as plain props.
 */
export default function HomeHighlightsPanel({
  locale,
  events,
  announcements,
  labels
}: {
  locale: string;
  events: HighlightEvent[];
  announcements: HighlightAnnouncement[];
  labels: HomeHighlightsLabels;
}) {
  const [tab, setTab] = useState<"events" | "announcements">("events");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CreditSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const trimmedQuery = query.trim();

  useEffect(() => {
    if (trimmedQuery.length === 0) {
      setResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const handle = setTimeout(() => {
      fetch(`/api/search/credits?q=${encodeURIComponent(trimmedQuery)}`)
        .then((res) => res.json())
        .then((data) => setResults(data.results ?? []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [trimmedQuery]);

  useEffect(() => {
    if (trimmedQuery.length === 0) return;
    function onClickAway(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setQuery("");
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setQuery("");
    }
    document.addEventListener("click", onClickAway);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClickAway);
      window.removeEventListener("keydown", onKey);
    };
  }, [trimmedQuery]);

  const showDropdown = trimmedQuery.length > 0;

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

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div ref={searchRef} className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={labels.searchPlaceholder}
              className="w-full rounded-full border border-border-strong bg-surface px-4 py-2.5 text-sm text-fg outline-none focus:border-fg-subtle"
            />
            {showDropdown && (
              <div className="absolute inset-x-0 top-full z-20 mt-2 max-h-80 overflow-y-auto rounded-xl border border-fg/10 bg-page shadow-2xl">
                {searching ? (
                  <p className="p-3 text-sm text-fg-subtle">
                    {labels.searching}
                  </p>
                ) : results && results.length > 0 ? (
                  <ul className="flex flex-col divide-y divide-fg/5">
                    {results.map((r) => (
                      <li key={r.photoId}>
                        <Link
                          href={`/gallery/${r.eventSlug}`}
                          onClick={() => setQuery("")}
                          className="flex items-center gap-3 p-2 transition hover:bg-fg/5"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={r.thumbUrl}
                            alt=""
                            className="h-12 w-12 shrink-0 rounded-lg object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-fg">
                              {formatPhotoCredit(r.creditName, r.subject)}
                            </p>
                            <p className="truncate text-xs text-fg-subtle">
                              {pickText(locale, r.eventTitleEn, r.eventTitleZh)}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="p-3 text-sm text-fg-subtle">
                    {labels.noResults}
                  </p>
                )}
              </div>
            )}
          </div>

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
