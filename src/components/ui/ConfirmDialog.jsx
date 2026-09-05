import { AlertTriangle } from "lucide-react";

import Modal from "./Modal";
import Button from "./Button";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  tone = "danger",
  loading = false,
  onConfirm,
  onClose,
}) {
  const isDanger = tone === "danger";

  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            variant={isDanger ? "danger" : "primary"}
            fullWidth
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center px-1 text-center">
        <span
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
            isDanger
              ? "bg-red-50 text-red-600 ring-1 ring-inset ring-red-100"
              : "bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100"
          }`}
        >
          <AlertTriangle size={24} strokeWidth={1.8} aria-hidden="true" />
        </span>

        <h2 className="mt-4 text-[17px] font-bold text-ink">{title}</h2>

        {description && (
          <p className="mt-2 text-[13.5px] leading-7 text-muted">{description}</p>
        )}
      </div>
    </Modal>
  );
}
