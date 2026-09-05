import { ShieldCheck } from "lucide-react";

import SettingsContentPage from "../../components/Site/SettingsContentPage";
import { PRIVACY_SECTIONS } from "../../content/legalContent";

export default function PrivacyPage() {
  return (
    <SettingsContentPage
      field="privacyPolicy"
      title="سياسة الخصوصية"
      eyebrow="قانوني"
      description="ما البيانات التي تجمعها منصة شوبيك لوبيك، ولماذا، وما الذي يظهر منها للآخرين."
      icon={ShieldCheck}
      fallbackSections={PRIVACY_SECTIONS}
    />
  );
}
