import {
  AtSign,
  FileText,
  Globe,
  Phone,
  Share2,
  ShieldAlert,
  Type,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";

import TextField, { TextAreaField } from "../../../../components/ui/TextField";
import Switch from "../../../../components/ui/Switch";
import SettingsSection from "./SettingsSection";
import { FIELD_LIMITS } from "../settingsConstants";
import { SOCIAL_NETWORKS } from "../../../../utils/siteSettings";
import { DEFAULT_LEGAL_TEXT } from "../../../../content/legalContent";

/** The links a public page can actually reach are Latin-script and LTR. */
const LTR = "ltr";

export function GeneralSection({ formik }) {
  return (
    <SettingsSection
      icon={Type}
      title="المعلومات العامة"
      description="اسم المنصة كما يظهر للزوّار، ووصفها المختصر."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          formik={formik}
          name="siteName"
          label="اسم الموقع (بالعربية)"
          placeholder="شوبيك لوبيك"
        />

        <TextField
          formik={formik}
          name="siteNameEn"
          label="اسم الموقع (بالإنجليزية)"
          dir={LTR}
          placeholder="Fayoum Marketplace"
        />

        <TextAreaField
          formik={formik}
          name="description"
          label="وصف الموقع"
          className="sm:col-span-2"
          rows={4}
          maxLength={FIELD_LIMITS.description}
          hint="يظهر في نتائج البحث وبطاقات المشاركة على وسائل التواصل."
          placeholder="اكتب وصفًا مختصرًا للمنصة…"
        />

        <TextAreaField
          formik={formik}
          name="address"
          label="العنوان"
          className="sm:col-span-2"
          rows={2}
          maxLength={FIELD_LIMITS.address}
          placeholder="الفيوم - جمهورية مصر العربية"
        />
      </div>
    </SettingsSection>
  );
}

export function ContactSection({ formik }) {
  return (
    <SettingsSection
      icon={Phone}
      title="بيانات التواصل"
      description="تظهر في تذييل الموقع وصفحة تواصل معنا."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          formik={formik}
          name="phoneNumber"
          label="رقم الهاتف"
          icon={Phone}
          type="tel"
          dir={LTR}
          placeholder="01000000000"
        />

        <TextField
          formik={formik}
          name="whatsAppNumber"
          label="رقم واتساب"
          type="tel"
          dir={LTR}
          placeholder="01000000000"
        />

        <TextField
          formik={formik}
          name="email"
          label="البريد الإلكتروني"
          icon={AtSign}
          type="email"
          dir={LTR}
          className="sm:col-span-2"
          placeholder="support@example.com"
        />
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-xl bg-brand-50 px-3.5 py-3 text-[12.5px] leading-6 text-ink-soft">
        <FaWhatsapp className="mt-0.5 h-4 w-4 shrink-0 text-[#128C4A]" />
        رقم واتساب يُحوَّل تلقائيًا إلى رابط محادثة مباشرة في التذييل وصفحة
        التواصل.
      </p>
    </SettingsSection>
  );
}

export function SocialSection({ formik }) {
  return (
    <SettingsSection
      icon={Share2}
      title="وسائل التواصل الاجتماعي"
      description="اترك الحقل فارغًا لإخفاء الشبكة من التذييل."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {SOCIAL_NETWORKS.map((network) => (
          <TextField
            key={network.key}
            formik={formik}
            name={network.field}
            label={network.label}
            icon={Globe}
            dir={LTR}
            placeholder={network.placeholder}
          />
        ))}
      </div>
    </SettingsSection>
  );
}

function UseDefaultText({ formik, name }) {
  const current = String(formik.values[name] ?? "").trim();

  const standard = DEFAULT_LEGAL_TEXT[name];

  if (!standard || current === standard) return null;

  const isReplace = current.length > 0;

  return (
    <button
      type="button"
      onClick={() => {
        if (isReplace && !window.confirm(
          "سيحل النص الافتراضي محل النص الحالي في هذا الحقل. يمكنك تعديله قبل الحفظ. هل تريد المتابعة؟"
        )) {
          return;
        }

        formik.setFieldValue(name, standard);
      }}
      className="cursor-pointer rounded-lg px-2 py-1 text-[12.5px] font-semibold text-brand-600 transition-colors duration-150 hover:bg-brand-50 hover:text-brand-900"
    >
      {isReplace
        ? "استبدال بالنص الافتراضي للمنصة"
        : "إدراج النص الافتراضي للمنصة"}
    </button>
  );
}

export function ContentSection({ formik }) {
  return (
    <SettingsSection
      icon={FileText}
      title="المحتوى والصفحات القانونية"
      description="يُنشر هذا المحتوى مباشرة على صفحات «من نحن» و«الشروط» و«الخصوصية»."
    >
      <div className="space-y-5">
        <TextAreaField
          formik={formik}
          name="aboutUs"
          label="من نحن"
          rows={7}
          hint="نص حر. تُعرض كل فقرة على سطر مستقل في الصفحة العامة."
          placeholder="عرّف الزوّار بالمنصة ورسالتها…"
        />

        <div className="space-y-2">
          <TextAreaField
            formik={formik}
            name="termsAndConditions"
            label="الشروط والأحكام"
            rows={9}
            placeholder="اكتب شروط استخدام المنصة…"
          />

          <UseDefaultText formik={formik} name="termsAndConditions" />
        </div>

        <div className="space-y-2">
          <TextAreaField
            formik={formik}
            name="privacyPolicy"
            label="سياسة الخصوصية"
            rows={9}
            placeholder="اشرح كيفية جمع البيانات واستخدامها…"
          />

          <UseDefaultText formik={formik} name="privacyPolicy" />
        </div>
      </div>
    </SettingsSection>
  );
}

export function MaintenanceSection({ formik }) {
  const enabled = Boolean(formik.values.maintenanceMode);

  return (
    <SettingsSection
      icon={ShieldAlert}
      title="وضع الصيانة"
      description="أوقف الموقع مؤقتًا عن الزوّار مع رسالة توضّح السبب."
      tone={enabled ? "warning" : "default"}
    >
      <div
        className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-4 py-3.5 transition-colors duration-200 ${
          enabled ? "border-gold-300 bg-gold-50" : "border-line bg-canvas"
        }`}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">
            {enabled ? "وضع الصيانة مُفعّل" : "الموقع يعمل بشكل طبيعي"}
          </p>

          <p className="mt-0.5 text-[12.5px] leading-6 text-muted">
            {enabled
              ? "لن يتمكّن الزوّار من تصفّح المنصة بعد حفظ الإعدادات."
              : "فعّل الوضع أثناء أعمال التطوير أو التحديثات الكبيرة."}
          </p>
        </div>

        <Switch
          checked={enabled}
          onChange={(next) => formik.setFieldValue("maintenanceMode", next)}
          label="وضع الصيانة"
        />
      </div>

      {enabled && (
        <div className="mt-5">
          <TextAreaField
            formik={formik}
            name="maintenanceMessage"
            label="رسالة الصيانة"
            rows={3}
            maxLength={FIELD_LIMITS.maintenanceMessage}
            hint="تُعرض للزوّار بدلًا من محتوى الموقع."
            placeholder="الموقع تحت الصيانة حاليًا، نعتذر عن الإزعاج…"
          />
        </div>
      )}
    </SettingsSection>
  );
}
