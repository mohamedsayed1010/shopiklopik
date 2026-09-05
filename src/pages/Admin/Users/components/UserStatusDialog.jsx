import { useMemo, useState } from "react";
import { AlertCircle, ChevronDown, SlidersHorizontal } from "lucide-react";

import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import {
  inputClass,
  labelClass,
  selectClass,
} from "../../../../components/ui/formStyles";
import { useAdminUserStatuses } from "../../../../hooks/admin/useAdminUsers";
import { userStatusTone } from "../usersConstants";

function StatusDialog({ open, user, onClose, mutation, onSubmit }) {
  const { statuses, statusesQuery } = useAdminUserStatuses();

  const [statusId, setStatusId] = useState("");

  const [reason, setReason] = useState("");

  const [touched, setTouched] = useState(false);

  const selected = useMemo(
    () => statuses.find((option) => String(option.id) === String(statusId)),
    [statuses, statusId]
  );

  const reasonRequired = Boolean(selected?.requiresNotes);

  const reasonMissing = reasonRequired && !reason.trim();

  const statusMissing = statusId === "";

  const isCurrent = selected && user && selected.id === user.status;

  return (
    <Modal
      open={open}
      onClose={mutation.isPending ? undefined : onClose}
      title="تغيير حالة الحساب"
      description={user ? `@${user.userName}` : undefined}
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button
            variant="outline"
            fullWidth
            onClick={onClose}
            disabled={mutation.isPending}
          >
            إلغاء
          </Button>

          <Button
            fullWidth
            loading={mutation.isPending}
            onClick={() => {
              setTouched(true);

              if (statusMissing || reasonMissing) return;

              onSubmit({
                id: user.id,
                status: Number(statusId),
                reason: reason.trim() || null,
              });
            }}
          >
            <SlidersHorizontal size={16} />
            حفظ الحالة
          </Button>
        </div>
      }
    >
      {/* The account being changed, so the dialog is never about "a" user. */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-canvas p-3.5">
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] font-semibold text-ink">
            {user?.name || user?.userName}
          </span>

          <span className="block text-[11.5px] text-muted">الحالة الحالية</span>
        </span>

        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset ${userStatusTone(
            user?.statusName
          )}`}
        >
          {user?.statusName || "—"}
        </span>
      </div>

      <div className="mt-4">
        <label htmlFor="user-status" className={labelClass}>
          الحالة الجديدة <span className="text-red-600">*</span>
        </label>

        <div className="relative">
          <select
            id="user-status"
            value={statusId}
            disabled={statusesQuery.isLoading}
            onChange={(event) => setStatusId(event.target.value)}
            aria-invalid={touched && statusMissing}
            className={selectClass({ invalid: touched && statusMissing })}
          >
            <option value="">
              {statusesQuery.isLoading ? "جارٍ التحميل…" : "اختر الحالة…"}
            </option>

            {statuses.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
                {user && option.id === user.status ? " (الحالية)" : ""}
              </option>
            ))}
          </select>

          <ChevronDown
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted end-4"
          />
        </div>

        {touched && statusMissing && (
          <p
            role="alert"
            className="mt-1.5 flex items-start gap-1.5 text-xs font-medium leading-5 text-red-600"
          >
            <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            اختر الحالة الجديدة أولًا.
          </p>
        )}

        {isCurrent && (
          <p className="mt-1.5 text-xs leading-5 text-muted">
            هذه هي الحالة الحالية للحساب بالفعل.
          </p>
        )}
      </div>

      <div className="mt-4">
        <label htmlFor="user-status-reason" className={labelClass}>
          السبب{" "}
          <span className="font-normal text-muted">
            {reasonRequired ? "(مطلوب)" : "(اختياري)"}
          </span>
        </label>

        <textarea
          id="user-status-reason"
          rows={4}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={
            reasonRequired
              ? "اذكر سبب تغيير الحالة…"
              : "سبب التغيير (اختياري) — يُحفظ مع سجل الحساب."
          }
          aria-invalid={touched && reasonMissing}
          className={`${inputClass({
            invalid: touched && reasonMissing,
            sized: false,
          })} py-3 leading-7`}
        />

        {touched && reasonMissing && (
          <p
            role="alert"
            className="mt-1.5 flex items-start gap-1.5 text-xs font-medium leading-5 text-red-600"
          >
            <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            هذه الحالة تتطلب ذكر السبب.
          </p>
        )}
      </div>
    </Modal>
  );
}

export default function UserStatusDialog(props) {
  /* Remount per user so a reason typed for one account never carries to the
     next, without an effect reaching in to clear three pieces of state. */
  return <StatusDialog key={props.user?.id ?? "none"} {...props} />;
}
