-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SiteSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'site',
    "siteTitleEn" TEXT NOT NULL DEFAULT '',
    "siteTitleZh" TEXT NOT NULL DEFAULT '',
    "homeTitleEn" TEXT NOT NULL DEFAULT '',
    "homeTitleZh" TEXT NOT NULL DEFAULT '',
    "homeSubtitleEn" TEXT NOT NULL DEFAULT '',
    "homeSubtitleZh" TEXT NOT NULL DEFAULT '',
    "backgroundColor" TEXT NOT NULL DEFAULT '',
    "backgroundImage" TEXT NOT NULL DEFAULT '',
    "logo" TEXT NOT NULL DEFAULT '',
    "creditTermEn" TEXT NOT NULL DEFAULT '',
    "creditTermZh" TEXT NOT NULL DEFAULT '',
    "subjectTermEn" TEXT NOT NULL DEFAULT '',
    "subjectTermZh" TEXT NOT NULL DEFAULT '',
    "bookingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lotteryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "creditProfilesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "contactEnabled" BOOLEAN NOT NULL DEFAULT false,
    "contactTitleEn" TEXT NOT NULL DEFAULT '',
    "contactTitleZh" TEXT NOT NULL DEFAULT '',
    "contactUrlEn" TEXT NOT NULL DEFAULT '',
    "contactUrlZh" TEXT NOT NULL DEFAULT '',
    "contactQrImageEn" TEXT NOT NULL DEFAULT '',
    "contactQrImageZh" TEXT NOT NULL DEFAULT '',
    "setupCompleted" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);
-- Existing single contactUrl/contactQrImage values (if any) are copied into
-- BOTH new per-locale columns rather than dropped, so a site that already
-- had one contact method configured keeps showing it on both languages
-- until the admin customizes each one separately.
INSERT INTO "new_SiteSettings" ("id", "siteTitleEn", "siteTitleZh", "homeTitleEn", "homeTitleZh", "homeSubtitleEn", "homeSubtitleZh", "backgroundColor", "backgroundImage", "logo", "creditTermEn", "creditTermZh", "subjectTermEn", "subjectTermZh", "bookingEnabled", "lotteryEnabled", "creditProfilesEnabled", "contactEnabled", "contactTitleEn", "contactTitleZh", "contactUrlEn", "contactUrlZh", "contactQrImageEn", "contactQrImageZh", "setupCompleted", "updatedAt")
SELECT "id", "siteTitleEn", "siteTitleZh", "homeTitleEn", "homeTitleZh", "homeSubtitleEn", "homeSubtitleZh", "backgroundColor", "backgroundImage", "logo", "creditTermEn", "creditTermZh", "subjectTermEn", "subjectTermZh", "bookingEnabled", "lotteryEnabled", "creditProfilesEnabled", "contactEnabled", "contactTitleEn", "contactTitleZh", "contactUrl", "contactUrl", "contactQrImage", "contactQrImage", "setupCompleted", "updatedAt"
FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
