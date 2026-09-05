import { AlertCircle, Save, Undo2 } from "lucide-react";

import Button from "../../../../components/ui/Button";

export default function SettingsSaveBar({
  visible,
  saving,
  canSave,
  onSave,
  onReset,
  errorCount = 0,
}) {
  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-16 z-40 px-4 pb-3 safe-bottom lg:bottom-0 lg:pb-5">
      <div className="pointer-events-auto mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 rounded-2xl border border-line-strong bg-surface/95 px-4 py-3 shadow-lg backdrop-blur-md">
        <p className="flex items-center gap-2 text-[13px] font-medium text-ink-soft">
          {errorCount > 0 ? (
            <>
              <AlertCircle size={16} aria-hidden="true" className="text-red-600" />

              <span className="text-red-600">
                {errorCount === 1
                  ? "حقل واحد يحتاج إلى مراجعة"
                  : `${errorCount} حقول تحتاج إلى مراجعة`}
              </span>
            </>
          ) : (
            <>
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full bg-gold-400"
              />
              لديك تغييرات غير محفوظة
            </>
          )}
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={saving}
          >
            <Undo2 size={15} />
            تراجع
          </Button>

          <Button size="sm" onClick={onSave} loading={saving} disabled={!canSave}>
            <Save size={15} />
            حفظ الإعدادات
          </Button>
        </div>
      </div>
    </div>
  );
}
