import { useState } from "react";
import { Power, PowerOff } from "lucide-react";

import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import { inputClass, labelClass } from "../../../../components/ui/formStyles";
import { accountStatusTone } from "../accountsConstants";

function StatusDialog({ open, account, onClose, mutation, onSubmit }) {
  const [reason, setReason] = useState("");

  /* Only set once a submission has actually been attempted, so the field does
     not open already complaining about being empty. */
  const [attempted, setAttempted] = useState(false);

  const next = !account?.isActive;

  const Icon = next ? Power : PowerOff;

  /* Deactivating only — see the note above. Trimmed, because the server counts
     a whitespace-only reason as missing too. */
  const trimmed = reason.trim();

  const reasonRequired = !next;

  const missingReason = reasonRequired && !trimmed;

  const submit = () => {
    if (missingReason) {
      setAttempted(true);

      return;
    }

    onSubmit({
      id: account.id,
      isActive: next,
      /* Unchanged: an empty reason is sent as null, which is what the contract
         takes and what activation accepts. */
      reason: trimmed || null,
    });
  };

  return (
    <Modal
      open={open}
      onClose={mutation.isPending ? undefined : onClose}
      title={next ? "تفعيل حساب المسؤول" : "تعطيل حساب المسؤول"}
      description={account ? `@${account.userName}` : undefined}
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={onClose}
            disabled={mutation.isPending}
          >
            إلغاء
          </Button>

          <Button
            type="button"
            variant={next ? "primary" : "danger"}
            fullWidth
            loading={mutation.isPending}
            disabled={missingReason}
            onClick={submit}
          >
            <Icon size={16} />
            {next ? "تفعيل الحساب" : "تعطيل الحساب"}
          </Button>
        </div>
      }
    >
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-canvas p-3.5">
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] font-semibold text-ink">
            {account?.name || account?.userName}
          </span>

          <span className="block text-[11.5px] text-muted">الحالة الحالية</span>
        </span>

        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset ${accountStatusTone(
            account?.isActive
          )}`}
        >
          {account?.statusName || (account?.isActive ? "مفعّل" : "معطّل")}
        </span>
      </div>

      <p className="mt-4 text-[13px] leading-7 text-ink-soft">
        {next
          ? "سيستعيد هذا الحساب الوصول إلى لوحة التحكم وفق الصلاحيات الممنوحة له."
          : "لن يتمكن هذا الحساب من الوصول إلى لوحة التحكم حتى يُعاد تفعيله."}
      </p>

      <div className="mt-4">
        <label htmlFor="admin-status-reason" className={labelClass}>
          السبب{" "}
          {reasonRequired ? (
            <span aria-hidden="true" className="text-red-600">
              *
            </span>
          ) : (
            <span className="font-normal text-muted">(اختياري)</span>
          )}
        </label>

        <textarea
          id="admin-status-reason"
          rows={4}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          required={reasonRequired}
          aria-invalid={attempted && missingReason ? true : undefined}
          aria-describedby={
            attempted && missingReason ? "admin-status-reason-error" : undefined
          }
          placeholder="سبب التغيير — يُرسَل مع الطلب ويُحفظ في سجل العمليات."
          className={`${inputClass({
            sized: false,
            invalid: attempted && missingReason,
          })} py-3 leading-7`}
        />

        {attempted && missingReason && (
          <p
            id="admin-status-reason-error"
            role="alert"
            className="mt-1.5 text-xs font-medium text-red-600"
          >
            سبب الإيقاف مطلوب.
          </p>
        )}
      </div>
    </Modal>
  );
}

export default function AdminAccountStatusDialog(props) {
  return (
    <StatusDialog
      key={props.open ? props.account?.id ?? "none" : "closed"}
      {...props}
    />
  );
}
