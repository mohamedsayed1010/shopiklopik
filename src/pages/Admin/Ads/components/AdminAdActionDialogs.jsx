import { useMemo, useState } from "react";
import { AlertCircle, Ban, CheckCircle2, XCircle } from "lucide-react";

import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import { inputClass, labelClass, selectClass } from "../../../../components/ui/formStyles";
import useAdminAdsMetadata from "../../../../hooks/admin/useAdminAdsMetadata";

/** Shared notes field. `required` comes from the reason, not from the dialog. */
function NotesField({ value, onChange, required, error, placeholder }) {
  return (
    <div className="mt-4">
      <label htmlFor="admin-ad-notes" className={labelClass}>
        ملاحظات{" "}
        <span className="font-normal text-muted">
          {required ? "(مطلوبة)" : "(اختيارية)"}
        </span>
      </label>

      <textarea
        id="admin-ad-notes"
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "admin-ad-notes-error" : undefined}
        className={`${inputClass({ invalid: Boolean(error), sized: false })} py-3 leading-7`}
      />

      {error && (
        <p
          id="admin-ad-notes-error"
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

/** The ad being acted on, so the dialog is never about "an" ad in the abstract. */
function Subject({ title, icon: Icon, tone }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-line bg-canvas p-3.5">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}
      >
        <Icon size={20} strokeWidth={1.9} aria-hidden="true" />
      </span>

      <p className="min-w-0 flex-1 text-[13.5px] leading-6 text-ink-soft">
        {title || "هذا الإعلان"}
      </p>
    </div>
  );
}

function ActionDialogs({
  action,
  ad,
  onClose,
  approveMutation,
  rejectMutation,
  suspendMutation,
  deleteMutation,
}) {
  const { rejectionReasons } = useAdminAdsMetadata();

  const [notes, setNotes] = useState("");

  const [reason, setReason] = useState("");

  const [touched, setTouched] = useState(false);

  const selectedReason = useMemo(
    () => rejectionReasons.find((option) => String(option.id) === String(reason)),
    [rejectionReasons, reason]
  );

  const notesRequired = Boolean(selectedReason?.requiresNotes);

  const notesMissing = notesRequired && !notes.trim();

  const reasonMissing = !reason;

  const target = ad ? { type: ad.type, id: ad.id } : null;

  if (!target) return null;

  const close = () => {
    onClose();
  };

  return (
    <>
      {/* ---------------------------- approve ---------------------------- */}
      <Modal
        open={action === "approve"}
        onClose={approveMutation.isPending ? undefined : close}
        title="الموافقة على الإعلان"
        description="سيصبح الإعلان متاحًا للمستخدمين بعد الموافقة."
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={close}
              disabled={approveMutation.isPending}
            >
              إلغاء
            </Button>

            <Button
              fullWidth
              loading={approveMutation.isPending}
              onClick={() =>
                approveMutation.mutate(
                  { ...target, notes: notes.trim() || null },
                  { onSuccess: close }
                )
              }
            >
              <CheckCircle2 size={17} />
              موافقة
            </Button>
          </div>
        }
      >
        <Subject
          title={ad.title}
          icon={CheckCircle2}
          tone="bg-emerald-50 text-emerald-600"
        />

        <NotesField
          value={notes}
          onChange={setNotes}
          required={false}
          placeholder="ملاحظة داخلية تُحفظ مع قرار الموافقة…"
        />
      </Modal>

      {/* ----------------------------- reject ---------------------------- */}
      <Modal
        open={action === "reject"}
        onClose={rejectMutation.isPending ? undefined : close}
        title="رفض الإعلان"
        description="اختر سبب الرفض. يظهر السبب لصاحب الإعلان."
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={close}
              disabled={rejectMutation.isPending}
            >
              إلغاء
            </Button>

            <Button
              variant="danger"
              fullWidth
              loading={rejectMutation.isPending}
              onClick={() => {
                setTouched(true);

                if (reasonMissing || notesMissing) return;

                rejectMutation.mutate(
                  {
                    ...target,
                    reason: Number(reason),
                    notes: notes.trim() || null,
                  },
                  { onSuccess: close }
                );
              }}
            >
              <XCircle size={17} />
              رفض الإعلان
            </Button>
          </div>
        }
      >
        <Subject title={ad.title} icon={XCircle} tone="bg-red-50 text-red-600" />

        <div className="mt-4">
          <label htmlFor="admin-reject-reason" className={labelClass}>
            سبب الرفض <span className="text-red-600">*</span>
          </label>

          <select
            id="admin-reject-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            aria-invalid={touched && reasonMissing}
            className={selectClass({ invalid: touched && reasonMissing })}
          >
            <option value="">اختر سببًا…</option>

            {rejectionReasons.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>

          {touched && reasonMissing && (
            <p
              role="alert"
              className="mt-1.5 flex items-start gap-1.5 text-xs font-medium leading-5 text-red-600"
            >
              <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
              اختر سبب الرفض أولًا.
            </p>
          )}
        </div>

        <NotesField
          value={notes}
          onChange={setNotes}
          required={notesRequired}
          error={touched && notesMissing ? "هذا السبب يتطلب كتابة ملاحظات." : null}
          placeholder={
            notesRequired
              ? "اشرح سبب الرفض لصاحب الإعلان…"
              : "تفاصيل إضافية (اختياري)…"
          }
        />
      </Modal>

      {/* ---------------------------- suspend ---------------------------- */}
      <Modal
        open={action === "suspend"}
        onClose={suspendMutation.isPending ? undefined : close}
        title="إيقاف الإعلان"
        description="سيُخفى الإعلان عن المستخدمين حتى يُعاد تفعيله."
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={close}
              disabled={suspendMutation.isPending}
            >
              إلغاء
            </Button>

            <Button
              variant="danger"
              fullWidth
              loading={suspendMutation.isPending}
              onClick={() =>
                suspendMutation.mutate(
                  { ...target, notes: notes.trim() || null },
                  { onSuccess: close }
                )
              }
            >
              <Ban size={17} />
              إيقاف الإعلان
            </Button>
          </div>
        }
      >
        <Subject title={ad.title} icon={Ban} tone="bg-orange-50 text-orange-600" />

        <NotesField
          value={notes}
          onChange={setNotes}
          required={false}
          placeholder="سبب الإيقاف (اختياري)…"
        />
      </Modal>

      {/* ----------------------------- delete ---------------------------- */}
      <ConfirmDialog
        open={action === "delete"}
        title="هل أنت متأكد أنك تريد حذف هذا الإعلان؟"
        description={`سيتم حذف "${
          ad.title || "الإعلان"
        }" نهائيًا ولا يمكن التراجع عن ذلك.`}
        confirmLabel="حذف نهائيًا"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(target, { onSuccess: close })}
        onClose={deleteMutation.isPending ? undefined : close}
      />
    </>
  );
}

export default function AdminAdActionDialogs(props) {
  /* Remount per (action, ad): the notes typed into a rejection that was
     cancelled must not reappear on the next ad's approval dialog. */
  return (
    <ActionDialogs
      key={`${props.action ?? "none"}-${props.ad?.id ?? "none"}`}
      {...props}
    />
  );
}
