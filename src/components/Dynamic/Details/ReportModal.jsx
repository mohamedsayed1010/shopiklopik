import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { AlertTriangle, Flag } from "lucide-react";

import Modal from "../../ui/Modal";
import Button from "../../ui/Button";
import { inputBase, inputIdle } from "../../ui/formStyles";
import { reportAdvertisement } from "../../../api/advertisements/interactions";
import { useReportReasons } from "../../../hooks/useListingModuleType";
import { advertisementActionsKey } from "../../../hooks/useAdvertisementActions";
import { apiError, apiMessage } from "../../../pages/Profile/profileCache";

export default function ReportModal({ open, onClose, adId, type, adTitle }) {
  const queryClient = useQueryClient();

  const { reasons, isLoading: isLoadingReasons, isError: hasReasonsError, refetch } =
    useReportReasons();

  /* `null` means "the reporter has not chosen yet", which resolves to the first
     published reason. Derived rather than written into state on arrival, so the
     list can load after the modal opens without an effect racing the render. */
  const [picked, setPicked] = useState(null);

  const [note, setNote] = useState("");

  const reason =
    picked !== null && reasons.some((item) => Number(item.id) === picked)
      ? picked
      : reasons.length > 0
        ? Number(reasons[0].id)
        : null;

  const mutation = useMutation({
    mutationFn: () =>
      reportAdvertisement(adId, { type, reason, details: note.trim() }),

    onSuccess: (response) => {
      const adKey = advertisementActionsKey(adId, type).slice(0, 2);

      queryClient.setQueriesData({ queryKey: adKey }, (previous) =>
        previous?.data
          ? {
              ...previous,
              data: { ...previous.data, hasReported: true, canReport: false },
            }
          : previous
      );

      queryClient.invalidateQueries({ queryKey: adKey });

      toast.success(apiMessage(response, "تم إرسال البلاغ بنجاح"));

      setNote("");

      setPicked(null);

      onClose?.();
    },

    onError: (error) => {
      toast.error(apiError(error, "تعذر إرسال البلاغ، حاول مرة أخرى"));
    },
  });

  const canSubmit =
    Boolean(adId) && Number.isFinite(Number(reason)) && !mutation.isPending;

  return (
    <Modal
      open={open}
      onClose={mutation.isPending ? undefined : onClose}
      title="الإبلاغ عن هذا الإعلان"
      description={
        adTitle
          ? `سيتم إرسال بلاغك عن "${adTitle}" إلى فريق المراجعة.`
          : "اختر سبب البلاغ وسيصل إلى فريق المراجعة."
      }
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button
            variant="outline"
            fullWidth
            disabled={mutation.isPending}
            onClick={onClose}
          >
            إلغاء
          </Button>

          <Button
            variant="danger"
            fullWidth
            loading={mutation.isPending}
            disabled={!canSubmit}
            onClick={() => mutation.mutate()}
          >
            <Flag size={17} />
            {mutation.isPending ? "جارٍ الإرسال…" : "إرسال البلاغ"}
          </Button>
        </div>
      }
    >
      <fieldset className="space-y-2">
        <legend className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
          <AlertTriangle size={16} className="text-red-500" />
          ما سبب البلاغ؟
        </legend>

        {isLoadingReasons && (
          <p className="py-2 text-sm text-muted">جارٍ تحميل أسباب البلاغ…</p>
        )}

        {hasReasonsError && reasons.length === 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            تعذّر تحميل أسباب البلاغ.{" "}
            <button
              type="button"
              onClick={() => refetch()}
              className="cursor-pointer font-bold underline underline-offset-2"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {reasons.map((item) => {
          const value = Number(item.id);

          const isSelected = reason === value;

          return (
            <label
              key={value}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-[border-color,background-color] duration-200 ${
                isSelected
                  ? "border-brand-900 bg-brand-50 text-brand-900"
                  : "border-line-strong bg-surface text-ink-soft hover:border-brand-300"
              }`}
            >
              <input
                hidden
                type="radio"
                name="report-reason"
                value={value}
                checked={isSelected}
                disabled={mutation.isPending}
                onChange={() => setPicked(value)}
              />

              <span
                aria-hidden="true"
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                  isSelected ? "border-brand-900" : "border-line-strong"
                }`}
              >
                {isSelected && (
                  <span className="h-2 w-2 rounded-full bg-brand-900" />
                )}
              </span>

              {item.name}
            </label>
          );
        })}
      </fieldset>

      <label className="mt-5 block">
        <span className="mb-2 block text-sm font-medium text-ink">
          تفاصيل إضافية{" "}
          <span className="text-xs font-normal text-muted">(اختياري)</span>
        </span>

        <textarea
          rows={3}
          value={note}
          disabled={mutation.isPending}
          onChange={(event) => setNote(event.target.value)}
          placeholder="اشرح المشكلة باختصار"
          className={`${inputBase} ${inputIdle} resize-y py-3 leading-7 disabled:opacity-60`}
        />
      </label>
    </Modal>
  );
}
