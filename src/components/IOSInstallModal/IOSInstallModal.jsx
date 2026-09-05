import { IoShareOutline, IoCheckmarkCircle } from "react-icons/io5";
import { MdOutlineAddBox } from "react-icons/md";

import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { LogoMark } from "../ui/Logo";
import { APP_NAME } from "../../utils/brand";

/* Same split as the lockup: primary word, then the gold remainder. Derived so
   the home-screen preview can never drift from the real name again. */
const [BRAND_LEAD, ...BRAND_TAIL] = APP_NAME.split(" ");

const BRAND_ACCENT = BRAND_TAIL.join(" ");

const STEPS = [
  {
    icon: IoShareOutline,
    title: "اضغط على زر المشاركة",
    hint: "Tap the Share button",
  },
  {
    icon: MdOutlineAddBox,
    title: "اختر إضافة إلى الشاشة الرئيسية",
    hint: "Add to Home Screen",
  },
  {
    icon: IoCheckmarkCircle,
    title: "اضغط إضافة",
    hint: "Tap Add",
  },
];

export default function IOSInstallModal({ open, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="تثبيت التطبيق"
      description="أضف شوبيك لوبيك إلى شاشتك الرئيسية للوصول السريع."
      size="sm"
      footer={
        <Button fullWidth onClick={onClose}>
          فهمت
        </Button>
      }
    >
      {/* Show the icon the user is about to add to their home screen. */}
      <div className="mb-7 flex items-center gap-4 rounded-2xl bg-canvas p-4">
        <LogoMark className="h-14 w-14" />

        <div className="min-w-0">
          <p className="font-bold text-ink">
            <span>{BRAND_LEAD}</span>
            <span className="text-gold-600">&nbsp;{BRAND_ACCENT}</span>
          </p>

          <p className="mt-0.5 text-xs text-muted">
            سيظهر هكذا على شاشتك الرئيسية
          </p>
        </div>
      </div>

      <ol className="space-y-5">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <step.icon size={20} />
            </span>

            <div>
              <p className="font-medium text-ink">
                <span className="tnum text-muted">{index + 1}.</span>{" "}
                {step.title}
              </p>

              <p dir="ltr" className="mt-0.5 text-start text-sm text-muted">
                {step.hint}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Modal>
  );
}
