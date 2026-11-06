import { useCallback, useEffect, useMemo, useRef } from "react";

import useDynamicForm from "../CreateAd/useDynamicForm";
import { useAdPaymentConfig } from "../../hooks/useAdPayment";
import {
  buildPaymentFormData,
  findPaymentMethod,
  isSubjectToPayment,
  paymentBlockOf,
  paymentFieldsOf,
  paymentGate,
  paymentLookups,
  userPaymentFields,
} from "../../utils/adPaymentForm";

/* The payment part of a create-ad (or payment) page: a second dynamic form,
   built from the Lookup's `payment.fields`, kept apart from the advertisement's
   own fields so nothing of it ever reaches the create endpoint.

   `lookup` is the create-ad-form `data`. The live config is read only when the
   Lookup says the form is subject to payment. */
export default function useAdPaymentForm(lookup) {
  const payment = paymentBlockOf(lookup);

  const subject = isSubjectToPayment(lookup);

  const configQuery = useAdPaymentConfig({ configEndpoint: payment?.configEndpoint, enabled: subject });

  const config = configQuery.data ?? null;

  const gate = paymentGate({ formData: lookup, config, configStatus: configQuery.status });

  const allFields = useMemo(() => paymentFieldsOf(lookup), [lookup]);

  const fields = useMemo(() => userPaymentFields(allFields), [allFields]);

  const form = useDynamicForm(fields);

  const { resetForm } = form;

  /* The payment fields are named the same in every module, so the form would
     keep a previous category's method and screenshot. A different form (or a
     different advertisement type) starts empty. */
  const identity = [lookup?.category?.id, lookup?.subCategory?.id, payment?.advertisementType].join("/");

  const previousIdentity = useRef(identity);

  useEffect(() => {
    if (previousIdentity.current === identity) return;

    previousIdentity.current = identity;

    resetForm();
  }, [identity, resetForm]);

  const lookups = useMemo(() => paymentLookups(config), [config]);

  const selectedMethod = findPaymentMethod(config, form.values.PaymentMethodId);

  const buildFormData = useCallback(
    () => buildPaymentFormData(allFields, form.values, config),
    [allFields, form.values, config]
  );

  return {
    payment,
    gate,
    isRequired: gate === "required",
    config,
    configQuery,
    fields,
    lookups,
    selectedMethod,
    buildFormData,
    ...form,
  };
}
