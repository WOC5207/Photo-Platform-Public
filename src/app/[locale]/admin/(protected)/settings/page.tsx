import { getTranslations, getLocale } from "next-intl/server";
import { siteImageUrl } from "@/lib/images";
import {
  getSiteSettings,
  getContactMethods,
  getPersonalLinks,
  resolveCreditTerm
} from "@/lib/settings";
import SiteSettingsForm from "@/components/admin/SiteSettingsForm";
import SiteImageUploader from "@/components/admin/SiteImageUploader";
import PersonalLinksManager from "@/components/admin/PersonalLinksManager";
import ContactMethodsManager from "@/components/admin/ContactMethodsManager";

export default async function SiteSettingsPage() {
  const t = await getTranslations("adminSite");
  const tc = await getTranslations("common");
  const locale = await getLocale();

  const settings = await getSiteSettings();
  const personalLinks = await getPersonalLinks();
  const contactMethods = await getContactMethods();
  const creditTerm = resolveCreditTerm(settings, locale, tc("creditTerm"));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-fg-subtle">{t("intro")}</p>
      </div>

      <SiteSettingsForm
        initial={{
          siteTitleEn: settings.siteTitleEn,
          siteTitleZh: settings.siteTitleZh,
          homeTitleEn: settings.homeTitleEn,
          homeTitleZh: settings.homeTitleZh,
          homeSubtitleEn: settings.homeSubtitleEn,
          homeSubtitleZh: settings.homeSubtitleZh,
          backgroundColor: settings.backgroundColor,
          creditTermEn: settings.creditTermEn,
          creditTermZh: settings.creditTermZh,
          subjectTermEn: settings.subjectTermEn,
          subjectTermZh: settings.subjectTermZh,
          bookingEnabled: settings.bookingEnabled,
          lotteryEnabled: settings.lotteryEnabled,
          creditProfilesEnabled: settings.creditProfilesEnabled,
          contactEnabled: settings.contactEnabled,
          contactTitleEn: settings.contactTitleEn,
          contactTitleZh: settings.contactTitleZh,
          contactUrl: settings.contactUrl
        }}
        creditTerm={creditTerm}
        logoSlot={
          <SiteImageUploader kind="logo" currentUrl={siteImageUrl(settings.logo)} />
        }
        backgroundImageSlot={
          <SiteImageUploader
            kind="background"
            currentUrl={siteImageUrl(settings.backgroundImage)}
          />
        }
        personalLinksSlot={
          <PersonalLinksManager
            links={personalLinks.map((l) => ({
              id: l.id,
              labelEn: l.labelEn,
              labelZh: l.labelZh,
              url: l.url
            }))}
          />
        }
        contactQrSlot={
          <SiteImageUploader
            kind="contactQr"
            currentUrl={siteImageUrl(settings.contactQrImage)}
          />
        }
        contactMethodsSlot={
          <ContactMethodsManager
            methods={contactMethods.map((m) => ({
              id: m.id,
              labelEn: m.labelEn,
              labelZh: m.labelZh
            }))}
          />
        }
      />
    </div>
  );
}
