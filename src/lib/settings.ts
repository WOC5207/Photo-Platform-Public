import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { pickText } from "@/lib/content";

export const SITE_SETTINGS_ID = "site";

export interface SiteSettings {
  id: string;
  siteTitleEn: string;
  siteTitleZh: string;
  homeTitleEn: string;
  homeTitleZh: string;
  homeSubtitleEn: string;
  homeSubtitleZh: string;
  backgroundColor: string;
  backgroundImage: string;
  logo: string;
  creditTermEn: string;
  creditTermZh: string;
  subjectTermEn: string;
  subjectTermZh: string;
  bookingEnabled: boolean;
  lotteryEnabled: boolean;
  creditProfilesEnabled: boolean;
  announcementsEnabled: boolean;
  contactEnabled: boolean;
  contactTitleEn: string;
  contactTitleZh: string;
  contactUrlEn: string;
  contactUrlZh: string;
  contactQrImageEn: string;
  contactQrImageZh: string;
  setupCompleted: boolean;
}

const DEFAULTS: SiteSettings = {
  id: SITE_SETTINGS_ID,
  siteTitleEn: "",
  siteTitleZh: "",
  homeTitleEn: "",
  homeTitleZh: "",
  homeSubtitleEn: "",
  homeSubtitleZh: "",
  backgroundColor: "",
  backgroundImage: "",
  logo: "",
  creditTermEn: "",
  creditTermZh: "",
  subjectTermEn: "",
  subjectTermZh: "",
  bookingEnabled: true,
  lotteryEnabled: true,
  creditProfilesEnabled: true,
  announcementsEnabled: true,
  contactEnabled: false,
  contactTitleEn: "",
  contactTitleZh: "",
  contactUrlEn: "",
  contactUrlZh: "",
  contactQrImageEn: "",
  contactQrImageZh: "",
  setupCompleted: false
};

/**
 * The single settings row, cached per-request so the layout and page can both
 * read it without a duplicate query. Returns sensible defaults before the
 * admin has saved anything.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const row = await prisma.siteSettings.findUnique({
    where: { id: SITE_SETTINGS_ID }
  });
  return row ?? DEFAULTS;
});

/**
 * Resolve the site's brand title for a locale, falling back to the other
 * language and finally to the caller-supplied default (the i18n siteName).
 */
export function resolveSiteTitle(
  settings: SiteSettings,
  locale: string,
  fallback: string
): string {
  return pickText(locale, settings.siteTitleEn, settings.siteTitleZh) || fallback;
}

/**
 * Resolve the homepage hero headline for a locale, falling back to the other
 * language and finally to the caller-supplied default (the i18n copy).
 */
export function resolveHomeTitle(
  settings: SiteSettings,
  locale: string,
  fallback: string
): string {
  return pickText(locale, settings.homeTitleEn, settings.homeTitleZh) || fallback;
}

/** Same as resolveHomeTitle, for the hero subtitle. */
export function resolveHomeSubtitle(
  settings: SiteSettings,
  locale: string,
  fallback: string
): string {
  return (
    pickText(locale, settings.homeSubtitleEn, settings.homeSubtitleZh) || fallback
  );
}

/**
 * Resolve the vocabulary term for "the person credited in a photo" (e.g. an
 * operator running a cosplay-photography site might override this to
 * "Cosplayer"), falling back to the caller-supplied i18n default.
 */
export function resolveCreditTerm(
  settings: SiteSettings,
  locale: string,
  fallback: string
): string {
  return pickText(locale, settings.creditTermEn, settings.creditTermZh) || fallback;
}

/** Same as resolveCreditTerm, for the "subject" (character/role/theme) concept. */
export function resolveSubjectTerm(
  settings: SiteSettings,
  locale: string,
  fallback: string
): string {
  return pickText(locale, settings.subjectTermEn, settings.subjectTermZh) || fallback;
}

/** Same as resolveHomeTitle, for the "Contact us" card heading. */
export function resolveContactTitle(
  settings: SiteSettings,
  locale: string,
  fallback: string
): string {
  return pickText(locale, settings.contactTitleEn, settings.contactTitleZh) || fallback;
}

/**
 * Resolve the "Contact us" link for a locale. Unlike resolveContactTitle,
 * this does NOT fall back to the other language — a WeChat link configured
 * only for the Chinese site shouldn't surface on the English one just
 * because nothing else is set there. Empty means no contact method for
 * that locale.
 */
export function resolveContactUrl(settings: SiteSettings, locale: string): string {
  return locale === "zh" ? settings.contactUrlZh : settings.contactUrlEn;
}

/** Same as resolveContactUrl, for the QR code image token. */
export function resolveContactQrToken(settings: SiteSettings, locale: string): string {
  return locale === "zh" ? settings.contactQrImageZh : settings.contactQrImageEn;
}

/** Admin-configured options for the booking form's contact-method dropdown. */
export const getContactMethods = cache(async () => {
  return prisma.contactMethod.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });
});

/** Admin-configured links to the photographer's other sites/profiles. */
export const getPersonalLinks = cache(async () => {
  return prisma.personalLink.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });
});

/** Admin-authored notices shown in the homepage panel's Announcements tab. */
export const getAnnouncements = cache(async () => {
  return prisma.announcement.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });
});

/**
 * Remembered credited-person social-link profiles (see syncCreditProfiles in
 * src/lib/photoCredits.ts), used to prefill the photo-credit editors so the
 * admin doesn't have to retype a person's links on every new photo.
 */
export const getCreditProfiles = cache(async () => {
  return prisma.creditProfile.findMany({
    include: { socialLinks: { orderBy: { sortOrder: "asc" } } },
    orderBy: { creditName: "asc" }
  });
});
