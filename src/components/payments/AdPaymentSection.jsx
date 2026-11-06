import { CreditCard } from "lucide-react";

import FieldRenderer from "../CreateAd/FieldRenderer";
import PaymentMethodInfo from "./PaymentMethodInfo";
import ErrorState from "../ui/ErrorState";
import Skeleton from "../ui/Skeleton";

/** Controls that need the full row, as in DynamicFormSections. */
const WIDE_TYPES = ["textarea", "image", "file", "radio"];

function formatAmount(price, currency) {
  if (price === null || price === undefined || price === "") return null;

  const amount = Number(price);

  const text = Number.isFinite(amount)
    ? amount.toLocaleString("ar-EG", { maximumFractionDigits: 2 })
    : String(price);

  return currency ? `${text} ${currency}` : text;
}

/* The payment section of a create-ad form (and of the payment page). Every
   value on it comes from the server: the price, currency, instructions and
   methods from the live config, the fields from the Lookup. `paymentForm` is
   what useAdPaymentForm returns.

   It renders nothing when no payment applies, so a form that is not subject to
   payment, or whose payments are switched off, looks exactly as before. */
export default function AdPaymentSection({ paymentForm, errors = {}, disabled = false, title = "الدفع" }) {
  const {
    gate,
    config,
    configQuery,
    sections,
    values,
    lookups,
    selectedMethod,
    requiredFor,
    handleChange,
    handleBlur,
  } = paymentForm;

  if (gate === "none") return null;

  if (gate === "loading") {
    return (
      <section className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-xs sm:p-6" aria-busy="true">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </section>
    );
  }

  if (gate === "error") {
    return (
      <ErrorState
        title="تعذّر تحميل بيانات الدفع"
        description="هذا الإعلان يتطلب الدفع، ولا يمكن إرساله قبل تحميل بيانات الدفع. حاول مرة أخرى."
        onRetry={() => configQuery.refetch()}
      />
    );
  }

  const amount = formatAmount(config?.price, config?.currency);

  const instructions = config?.instructions?.trim();

  const fields = sections.flatMap((section) => section.fields);

  const noMethods = !config?.paymentMethods?.length;

  return (
    <section
      className="rounded-2xl border border-line bg-surface p-5 shadow-xs sm:p-6"
      aria-labelledby="ad-payment-title"
      data-field="ad-payment"
    >
      <h2
        id="ad-payment-title"
        className="mb-5 flex items-center gap-2 border-b border-line pb-4 text-base font-semibold text-ink"
      >
        <CreditCard size={18} aria-hidden="true" className="text-brand-500" />
        {title}
      </h2>

      {amount && (
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2 rounded-xl bg-gold-50 px-4 py-3 ring-1 ring-inset ring-gold-200">
          <span className="text-[13px] text-ink-soft">رسوم نشر الإعلان</span>
          <span className="text-lg font-bold text-ink tnum" dir="auto">
            {amount}
          </span>
        </div>
      )}

      {instructions && (
        <p className="mb-5 whitespace-pre-line rounded-xl bg-brand-50 px-3.5 py-3 text-[13px] leading-6 text-ink-soft">
          {instructions}
        </p>
      )}

      {noMethods ? (
        <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-3 text-[13px] text-red-700 ring-1 ring-inset ring-red-200">
          لا توجد طرق دفع متاحة حاليًا، لذلك لا يمكن إرسال الإعلان الآن. حاول لاحقًا أو تواصل معنا.
        </p>
      ) : (
        <fieldset disabled={disabled} className="grid gap-5 md:grid-cols-2">
          {fields.map((field) => (
            <div
              key={field.name}
              data-field={field.name}
              className={WIDE_TYPES.includes(field.type) ? "md:col-span-2" : ""}
            >
              <FieldRenderer
                field={field}
                value={values[field.name]}
                error={errors[field.name]}
                required={requiredFor(field)}
                lookups={lookups}
                onChange={handleChange}
                onBlur={handleBlur}
              />

              {/* The selected method's transfer details, right under the choice. */}
              {field.optionsSource === "paymentMethods" && selectedMethod && (
                <PaymentMethodInfo method={selectedMethod} className="mt-4" />
              )}
            </div>
          ))}
        </fieldset>
      )}
    </section>
  );
}
