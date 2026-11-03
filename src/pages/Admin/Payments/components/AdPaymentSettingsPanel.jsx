import { useMemo, useRef, useState } from "react";
import { RotateCcw, Save } from "lucide-react";

import Button from "../../../../components/ui/Button";
import Switch from "../../../../components/ui/Switch";
import ErrorState from "../../../../components/ui/ErrorState";
import Skeleton from "../../../../components/ui/Skeleton";
import {
  errorClass,
  hintClass,
  inputClass,
  labelClass,
} from "../../../../components/ui/formStyles";
import {
  useAdPaymentSettings,
  useUpdateAdPaymentSettings,
} from "../../../../hooks/admin/useAdminAdPayment";
import { useAdminPaymentMethods } from "../../../../hooks/admin/useAdminPaymentMethods";
import {
  METHODS_MODE,
  adPaymentErrorCopy,
  isSettingsDirty,
  settingsToForm,
  toSettingsPayload,
  validateSettingsForm,
} from "../../../../utils/adPayment";
import { apiErrorMessages } from "../../../../utils/apiErrors";
import { formatDateTime, formatMoney } from "../../../../utils/format";


function Detail({ label, value, ltr = false }) {
  if (value === null || value === undefined || value === "") return null;

  return (
    <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 text-[12.5px]">
      <dt className="text-muted">{label}</dt>
      <dd dir={ltr ? "ltr" : undefined} className="min-w-0 break-words text-ink [overflow-wrap:anywhere]">
        {value}
      </dd>
    </div>
  );
}

/* `typeName` is the server's own label, from the admin payment-methods list;
   the settings payload carries only the number. */
function MethodCard({ method, typeName }) {
  return (
    <li className="rounded-2xl border border-line bg-canvas p-4">
      <p className="text-[14px] font-semibold text-ink">
        {method.arabicName || method.name || `#${method.id}`}
        {method.arabicName && method.name && (
          <span dir="ltr" className="ms-2 text-[12px] font-normal text-muted">{method.name}</span>
        )}
      </p>

      <dl className="mt-2 space-y-1">
        <Detail label="المعرّف" value={method.id != null ? `#${method.id}` : null} />
        <Detail label="النوع" value={typeName || method.typeName || (method.type != null ? `#${method.type}` : null)} />
        <Detail label="رقم الهاتف" value={method.phoneNumber} ltr />
        <Detail label="معرّف إنستا باي" value={method.instaPayIdentifier} ltr />
        <Detail label="البنك" value={method.bankName} />
        <Detail label="اسم صاحب الحساب" value={method.accountHolderName} />
        <Detail label="رقم الحساب" value={method.accountNumber} ltr />
        <Detail label="IBAN" value={method.iban} ltr />
        <Detail label="بيانات الدفع" value={method.paymentInfo} ltr />
        <Detail label="التعليمات" value={method.instructions} />
      </dl>
    </li>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-40 w-full rounded-3xl" />
      <Skeleton className="h-64 w-full rounded-3xl" />
    </div>
  );
}

function Summary({ settings, typeNames }) {
  const selected = Array.isArray(settings.paymentMethodIds) ? settings.paymentMethodIds : [];

  return (
    <section className="rounded-3xl border border-line bg-surface p-5 shadow-xs">
      <h2 className="text-[15px] font-bold text-ink">الإعدادات الحالية</h2>

      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        <Detail label="الدفع للإعلانات" value={settings.isEnabled ? "مفعّل" : "غير مفعّل"} />
        <Detail label="السعر" value={formatMoney(settings.price, settings.currency)} />
        <Detail label="العملة" value={settings.currency} ltr />
        <Detail
          label="طرق الدفع"
          value={
            settings.usesAllActiveMethods
              ? "كل الطرق النشطة"
              : selected.length
                ? selected.map((id) => `#${id}`).join("، ")
                : null
          }
        />
        <Detail label="تاريخ التفعيل" value={formatDateTime(settings.enabledAt) || null} />
        <Detail label="آخر تحديث" value={formatDateTime(settings.updatedAt) || null} />
        <Detail label="حدّثه" value={settings.updatedByName} />
        <Detail label="معرّف من حدّثه" value={settings.updatedBy} ltr />
      </dl>

      {settings.instructions && (
        <div className="mt-3 rounded-2xl bg-canvas p-3 text-[13px] leading-7 text-ink-soft">
          <p className="mb-1 text-[12px] font-semibold text-muted">التعليمات العامة</p>
          <p className="whitespace-pre-line">{settings.instructions}</p>
        </div>
      )}

      <h3 className="mt-5 text-[13px] font-bold text-ink">طرق الدفع المعروضة للمعلنين</h3>

      {Array.isArray(settings.paymentMethods) && settings.paymentMethods.length ? (
        <ul className="mt-2 grid gap-3 md:grid-cols-2">
          {settings.paymentMethods.map((method) => (
            <MethodCard key={method.id} method={method} typeName={typeNames.get(Number(method.id))} />
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">لا توجد طرق دفع ضمن هذه الإعدادات.</p>
      )}
    </section>
  );
}

function SettingsForm({ settings, methodOptions }) {
  const initial = useMemo(() => settingsToForm(settings), [settings]);

  const [form, setForm] = useState(initial);

  const [submitted, setSubmitted] = useState(false);

  const lock = useRef(false);

  const update = useUpdateAdPaymentSettings({
    onDone: () => setSubmitted(false),
  });

  const errors = validateSettingsForm(form);

  const hasErrors = Object.keys(errors).length > 0;

  const dirty = isSettingsDirty(form, initial);

  const show = (field) => (submitted ? errors[field] : null);

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  const toggleMethod = (id) =>
    set({
      paymentMethodIds: form.paymentMethodIds.includes(id)
        ? form.paymentMethodIds.filter((value) => value !== id)
        : [...form.paymentMethodIds, id],
    });

  const save = (event) => {
    event.preventDefault();

    setSubmitted(true);

    if (hasErrors || !dirty || lock.current) return;

    lock.current = true;

    update.mutate(toSettingsPayload(form), {
      onSettled: () => {
        lock.current = false;
      },
    });
  };

  const serverError = update.isError ? adPaymentErrorCopy(update.error, { subject: "إعدادات الدفع" }) : null;

  const serverDetails =
    update.isError && [400, 422].includes(serverError?.status)
      ? apiErrorMessages(update.error)
      : [];

  const pending = update.isPending;

  return (
    <form onSubmit={save} noValidate className="rounded-3xl border border-line bg-surface p-5 shadow-xs">
      <h2 className="text-[15px] font-bold text-ink">تعديل الإعدادات</h2>

      <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-line bg-canvas p-4">
        <div>
          <p className="text-sm font-semibold text-ink">تفعيل الدفع للإعلانات</p>
          <p className={hintClass}>عند التفعيل يُطلب من المعلن إثبات الدفع.</p>
        </div>

        <Switch
          checked={form.isEnabled}
          onChange={(value) => set({ isEnabled: value })}
          disabled={pending}
          label="تفعيل الدفع للإعلانات"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ad-payment-price" className={labelClass}>السعر</label>
          <input
            id="ad-payment-price"
            type="text"
            inputMode="decimal"
            dir="ltr"
            value={form.price}
            onChange={(event) => set({ price: event.target.value })}
            disabled={pending}
            aria-invalid={Boolean(show("price")) || undefined}
            aria-describedby={show("price") ? "ad-payment-price-error" : undefined}
            className={inputClass({ invalid: Boolean(show("price")) })}
          />
          {show("price") && <p id="ad-payment-price-error" className={errorClass}>{show("price")}</p>}
        </div>

        <div>
          <label htmlFor="ad-payment-currency" className={labelClass}>العملة</label>
          <input
            id="ad-payment-currency"
            type="text"
            dir="ltr"
            value={form.currency}
            onChange={(event) => set({ currency: event.target.value })}
            disabled={pending}
            aria-invalid={Boolean(show("currency")) || undefined}
            aria-describedby={show("currency") ? "ad-payment-currency-error" : undefined}
            className={inputClass({ invalid: Boolean(show("currency")) })}
          />
          {show("currency") && <p id="ad-payment-currency-error" className={errorClass}>{show("currency")}</p>}
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="ad-payment-instructions" className={labelClass}>التعليمات العامة</label>
        <textarea
          id="ad-payment-instructions"
          rows={4}
          value={form.instructions}
          onChange={(event) => set({ instructions: event.target.value })}
          disabled={pending}
          className={`${inputClass({ sized: false })} py-3`}
        />
      </div>

      <fieldset className="mt-5" disabled={pending}>
        <legend className={labelClass}>طرق الدفع</legend>

        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="ad-payment-methods-mode"
              checked={form.methodsMode === METHODS_MODE.all}
              onChange={() => set({ methodsMode: METHODS_MODE.all })}
            />
            كل الطرق النشطة
          </label>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="ad-payment-methods-mode"
              checked={form.methodsMode === METHODS_MODE.selected}
              onChange={() => set({ methodsMode: METHODS_MODE.selected })}
            />
            طرق محددة
          </label>
        </div>

        {form.methodsMode === METHODS_MODE.selected && (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2" aria-describedby={show("paymentMethodIds") ? "ad-payment-methods-error" : undefined}>
            {methodOptions.map((method) => (
              <li key={method.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={form.paymentMethodIds.includes(method.id)}
                    onChange={() => toggleMethod(method.id)}
                  />
                  <span className="min-w-0 flex-1 truncate text-ink">
                    {method.arabicName || method.name || `#${method.id}`}
                  </span>
                  {method.isActive === false && (
                    <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-[11px] text-muted ring-1 ring-inset ring-line-strong">
                      غير نشطة
                    </span>
                  )}
                </label>
              </li>
            ))}
          </ul>
        )}

        {show("paymentMethodIds") && (
          <p id="ad-payment-methods-error" className={errorClass}>{show("paymentMethodIds")}</p>
        )}
      </fieldset>

      {serverError && (
        <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">
          <p className="font-semibold">{serverError.title}</p>
          {serverDetails.length > 1 ? (
            <ul className="mt-1 list-disc space-y-0.5 ps-5">
              {serverDetails.map((text) => <li key={text}>{text}</li>)}
            </ul>
          ) : (
            <p className="mt-1">{serverError.description}</p>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setForm(initial);
            setSubmitted(false);
            update.reset();
          }}
          disabled={!dirty || pending}
        >
          <RotateCcw size={15} />
          تجاهل التغييرات
        </Button>

        <Button type="submit" loading={pending} disabled={!dirty || pending}>
          <Save size={15} />
          حفظ الإعدادات
        </Button>
      </div>
    </form>
  );
}

export default function AdPaymentSettingsPanel({ canEdit }) {
  const query = useAdPaymentSettings();

  /* The options are every method the admin can manage (active or not); if that
     list cannot be read, the methods the settings already carry stand in. */
  const { methods } = useAdminPaymentMethods();

  const settings = query.data?.data;

  const methodOptions = useMemo(() => {
    const source = methods.length ? methods : (settings?.paymentMethods ?? []);

    return [...source]
      .filter((method) => Number.isInteger(Number(method?.id)))
      .map((method) => ({ ...method, id: Number(method.id) }))
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.id - b.id);
  }, [methods, settings]);

  const typeNames = useMemo(
    () => new Map(methods.filter((method) => method?.typeName).map((method) => [Number(method.id), method.typeName])),
    [methods]
  );

  if (query.isLoading) return <SettingsSkeleton />;

  if (query.isError) {
    const copy = adPaymentErrorCopy(query.error, { subject: "إعدادات الدفع" });

    return (
      <ErrorState
        title={copy.title}
        description={copy.description}
        onRetry={copy.status === 403 ? undefined : query.refetch}
      />
    );
  }

  if (!settings || typeof settings !== "object") {
    return <ErrorState title="لا توجد بيانات" description="لم يُرجع الخادم إعدادات الدفع." onRetry={query.refetch} />;
  }

  return (
    <div className="space-y-5">
      <Summary settings={settings} typeNames={typeNames} />

      {canEdit ? (
        /* Re-keyed on the saved record, so a successful save (or a refetch
           that changed it) restarts the form from what the server holds. */
        <SettingsForm
          key={`${settings.updatedAt ?? ""}|${JSON.stringify(toSettingsPayload(settingsToForm(settings)))}`}
          settings={settings}
          methodOptions={methodOptions}
        />
      ) : (
        <p className="rounded-2xl border border-line bg-canvas p-4 text-[13px] text-muted">
          لديك صلاحية العرض فقط. تعديل إعدادات الدفع يتطلب صلاحية «تعديل» على صفحة المدفوعات.
        </p>
      )}
    </div>
  );
}
