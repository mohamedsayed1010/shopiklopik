import { ScrollText } from "lucide-react";

import SettingsContentPage from "../../components/Site/SettingsContentPage";
import { TERMS_SECTIONS } from "../../content/legalContent";

export default function TermsPage() {
  return (
    <SettingsContentPage
      field="termsAndConditions"
      title="الشروط والأحكام"
      eyebrow="قانوني"
      description="شروط استخدام منصة شوبيك لوبيك: مسؤولية المُعلن، مراجعة الإعلانات، والتزامات كل طرف."
      icon={ScrollText}
      /* Shown only if the administrator has published nothing — a legal page
         that reads "not published yet" is the worst thing a buyer can find. */
      fallbackSections={TERMS_SECTIONS}
    />
  );
}
