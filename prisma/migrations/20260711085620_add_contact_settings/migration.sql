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
    "contactUrl" TEXT NOT NULL DEFAULT '',
    "contactQrImage" TEXT NOT NULL DEFAULT '',
    "setupCompleted" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SiteSettings" ("backgroundColor", "backgroundImage", "bookingEnabled", "creditProfilesEnabled", "creditTermEn", "creditTermZh", "homeSubtitleEn", "homeSubtitleZh", "homeTitleEn", "homeTitleZh", "id", "logo", "lotteryEnabled", "setupCompleted", "siteTitleEn", "siteTitleZh", "subjectTermEn", "subjectTermZh", "updatedAt") SELECT "backgroundColor", "backgroundImage", "bookingEnabled", "creditProfilesEnabled", "creditTermEn", "creditTermZh", "homeSubtitleEn", "homeSubtitleZh", "homeTitleEn", "homeTitleZh", "id", "logo", "lotteryEnabled", "setupCompleted", "siteTitleEn", "siteTitleZh", "subjectTermEn", "subjectTermZh", "updatedAt" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
