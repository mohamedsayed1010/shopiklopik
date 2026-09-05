import { Info } from "lucide-react";

import SettingsContentPage from "../../components/Site/SettingsContentPage";

export default function AboutPage() {
  return (
    <SettingsContentPage
      field="aboutUs"
      title="من نحن"
      eyebrow="المنصة"
      description="تعرّف على المنصة ورسالتها."
      icon={Info}
    />
  );
}
