-- Rename cosplay-specific fields to generic credit/subject terminology
ALTER TABLE "PhotoCredit" RENAME COLUMN "cosplayerCn" TO "creditName";
ALTER TABLE "PhotoCredit" RENAME COLUMN "characterName" TO "subject";
ALTER TABLE "Booking" RENAME COLUMN "characterName" TO "subject";
ALTER TABLE "LotteryEntry" RENAME COLUMN "characterName" TO "subject";

-- Rename the remembered-profile roster to generic terminology
ALTER TABLE "Cosplayer" RENAME TO "CreditProfile";
ALTER TABLE "CreditProfile" RENAME COLUMN "cosplayerCn" TO "creditName";
ALTER TABLE "CosplayerSocialLink" RENAME TO "CreditProfileSocialLink";
ALTER TABLE "CreditProfileSocialLink" RENAME COLUMN "cosplayerId" TO "creditProfileId";

-- Add admin-configurable terminology overrides to SiteSettings
ALTER TABLE "SiteSettings" ADD COLUMN "creditTermEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN "creditTermZh" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN "subjectTermEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN "subjectTermZh" TEXT NOT NULL DEFAULT '';
