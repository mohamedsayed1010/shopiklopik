import { useMemo, useState } from "react";
import { AlertCircle, AlertTriangle, ChevronDown, Gavel, PencilLine, ShieldOff } from "lucide-react";

import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import { inputClass, labelClass, selectClass } from "../../../../components/ui/formStyles";
import { useAdminReportsMetadata } from "../../../../hooks/admin/useAdminReports";
import {
  DESTRUCTIVE_SEVERITY,
  REPORT_ACTIONS,
  reportStatusTone,
} from "../reportsConstants";

function NoteField({ id, value, onChange, label, placeholder, required, error }) {
  return (
    <div className="mt-4">
      <label htmlFor={id} className={labelClass}>
        {label}{" "}
        <span className="font-normal text-muted">
          {required ? "(مطلوبة)" : "(اختيارية)"}
        </span>
      </label>

      <textarea
        id={id}
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={`${inputClass({ invalid: Boolean(error), sized: false })} py-3 leading-7`}
      />

      {error && (
        <p
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 text-xs font-medium leading-5 text-red-600"
        >
          <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

/** The report being decided, so no dialog is about "a" report in the abstract. */
function Subject({ report }) {
  return (
    <div className="rounded-2xl border border-line bg-canvas p-3.5">
      <p className="truncate text-[13.5px] font-semibold text-ink">
        {report?.listingTitle || "إعلان محذوف"}
      </p>

      <p className="mt-0.5 truncate text-[11.5px] text-muted">
        {report?.listingTypeName} · {report?.reasonName}
      </p>
    </div>
  );
}

function Dialogs({
  dialog,
  report,
  onClose,
  ignoreMutation,
  actionMutation,
  updateMutation,
}) {
  const { statuses } = useAdminReportsMetadata();

  const [note, setNote] = useState("");

  const [actionId, setActionId] = useState("");

  const [statusId, setStatusId] = useState("");

  const [adminNote, setAdminNote] = useState("");

  const [touched, setTouched] = useState(false);

  /* The second step of "take action" — only reached once an action is picked
     and only for the ones that change the listing. */
  const [isConfirming, setIsConfirming] = useState(false);

  const selectedAction = useMemo(
    () => REPORT_ACTIONS.find((a) => String(a.id) === String(actionId)),
    [actionId]
  );

  const actionMissing = actionId === "";

  const statusMissing = statusId === "";

  if (!report) return null;

  const target = { id: report.id };

  return (
    <>
      {/* ---------------------------- ignore ---------------------------- */}
      <Modal
        open={dialog === "ignore"}
        onClose={ignoreMutation.isPending ? undefined : onClose}
        title="تجاهل البلاغ"
        description="سيُغلق البلاغ باعتباره غير مبرَّر، ولن يتأثر الإعلان."
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={onClose}
              disabled={ignoreMutation.isPending}
            >
              إلغاء
            </Button>

            <Button
              fullWidth
              loading={ignoreMutation.isPending}
              onClick={() =>
                ignoreMutation.mutate(
                  { ...target, note: note.trim() || null },
                  { onSuccess: onClose }
                )
              }
            >
              <ShieldOff size={16} />
              تجاهل البلاغ
            </Button>
          </div>
        }
      >
        <Subject report={report} />

        <NoteField
          id="report-ignore-note"
          label="ملاحظة الإدارة"
          value={note}
          onChange={setNote}
          placeholder="سبب اعتبار البلاغ غير مبرَّر — تُحفظ مع البلاغ."
        />
      </Modal>

      {/* ---------------------------- action ---------------------------- */}
      <Modal
        open={dialog === "action"}
        onClose={actionMutation.isPending ? undefined : onClose}
        title={isConfirming ? "تأكيد الإجراء" : "اتخاذ إجراء على البلاغ"}
        description={
          isConfirming
            ? undefined
            : "اختر ما يجب أن يحدث للإعلان المُبلَّغ عنه."
        }
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => (isConfirming ? setIsConfirming(false) : onClose())}
              disabled={actionMutation.isPending}
            >
              {isConfirming ? "رجوع" : "إلغاء"}
            </Button>

            <Button
              variant={
                selectedAction?.severity >= DESTRUCTIVE_SEVERITY
                  ? "danger"
                  : "primary"
              }
              fullWidth
              loading={actionMutation.isPending}
              onClick={() => {
                setTouched(true);

                if (actionMissing) return;

                /* Anything that changes the listing gets a second look. */
                if (
                  selectedAction.severity >= DESTRUCTIVE_SEVERITY &&
                  !isConfirming
                ) {
                  setIsConfirming(true);

                  return;
                }

                actionMutation.mutate(
                  {
                    ...target,
                    action: Number(actionId),
                    note: note.trim() || null,
                  },
                  { onSuccess: onClose }
                );
              }}
            >
              <Gavel size={16} />
              {isConfirming ? "تأكيد وتنفيذ" : "متابعة"}
            </Button>
          </div>
        }
      >
        {isConfirming && selectedAction ? (
          <div className="text-center">
            <span
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ring-inset ${selectedAction.tone}`}
            >
              <AlertTriangle size={24} strokeWidth={1.9} aria-hidden="true" />
            </span>

            <h3 className="mt-4 text-[15px] font-bold text-ink">
              {selectedAction.label}
            </h3>

            <p className="mt-2 text-[13px] leading-6 text-muted">
              {selectedAction.description}
            </p>

            <p className="mt-3 rounded-xl border border-line bg-canvas px-3 py-2.5 text-[13px] font-semibold text-ink">
              {report.listingTitle || "إعلان محذوف"}
            </p>
          </div>
        ) : (
          <>
            <Subject report={report} />

            <div className="mt-4">
              <label htmlFor="report-action" className={labelClass}>
                الإجراء <span className="text-red-600">*</span>
              </label>

              <div className="relative">
                <select
                  id="report-action"
                  value={actionId}
                  onChange={(event) => setActionId(event.target.value)}
                  aria-invalid={touched && actionMissing}
                  className={selectClass({ invalid: touched && actionMissing })}
                >
                  <option value="">اختر الإجراء…</option>

                  {REPORT_ACTIONS.map((action) => (
                    <option key={action.id} value={action.id}>
                      {action.label}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={18}
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted end-4"
                />
              </div>

              {touched && actionMissing && (
                <p
                  role="alert"
                  className="mt-1.5 flex items-start gap-1.5 text-xs font-medium leading-5 text-red-600"
                >
                  <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                  اختر الإجراء أولًا.
                </p>
              )}

              {/* Says what the chosen value actually does before it is sent. */}
              {selectedAction && (
                <p className="mt-2 rounded-xl border border-line bg-canvas px-3 py-2 text-[12.5px] leading-6 text-ink-soft">
                  {selectedAction.description}
                </p>
              )}
            </div>

            <NoteField
              id="report-action-note"
              label="ملاحظة الإدارة"
              value={note}
              onChange={setNote}
              placeholder="سبب اتخاذ هذا الإجراء — تُحفظ مع البلاغ."
            />
          </>
        )}
      </Modal>

      {/* ---------------------------- update ---------------------------- */}
      <Modal
        open={dialog === "update"}
        onClose={updateMutation.isPending ? undefined : onClose}
        title="تحديث حالة البلاغ"
        description="تغيير الحالة والملاحظة دون اتخاذ إجراء على الإعلان."
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={onClose}
              disabled={updateMutation.isPending}
            >
              إلغاء
            </Button>

            <Button
              fullWidth
              loading={updateMutation.isPending}
              onClick={() => {
                setTouched(true);

                if (statusMissing) return;

                updateMutation.mutate(
                  {
                    ...target,
                    status: Number(statusId),
                    adminNote: adminNote.trim() || null,
                  },
                  { onSuccess: onClose }
                );
              }}
            >
              <PencilLine size={16} />
              حفظ
            </Button>
          </div>
        }
      >
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-canvas p-3.5">
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-semibold text-ink">
              {report.listingTitle || "إعلان محذوف"}
            </span>

            <span className="block text-[11.5px] text-muted">الحالة الحالية</span>
          </span>

          <span
            className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset ${reportStatusTone(
              report.statusName
            )}`}
          >
            {report.statusName || "—"}
          </span>
        </div>

        <div className="mt-4">
          <label htmlFor="report-status" className={labelClass}>
            الحالة الجديدة <span className="text-red-600">*</span>
          </label>

          <div className="relative">
            <select
              id="report-status"
              value={statusId}
              onChange={(event) => setStatusId(event.target.value)}
              aria-invalid={touched && statusMissing}
              className={selectClass({ invalid: touched && statusMissing })}
            >
              <option value="">اختر الحالة…</option>

              {/* Straight from `/reports/metadata`. */}
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                  {status.id === report.status ? " (الحالية)" : ""}
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
        </div>

        <NoteField
          id="report-admin-note"
          label="ملاحظة الإدارة"
          value={adminNote}
          onChange={setAdminNote}
          placeholder="ملاحظة تُحفظ مع البلاغ."
        />
      </Modal>
    </>
  );
}

export default function ReportActionDialogs(props) {
  /* Remount per (dialog, report) so a note typed into one decision never
     reappears in the next — no effect reaching in to reset five fields. */
  return (
    <Dialogs
      key={`${props.dialog ?? "none"}-${props.report?.id ?? "none"}`}
      {...props}
    />
  );
}
