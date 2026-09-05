import toast from "react-hot-toast";

import { mapApiErrors, joinFieldErrors } from "./apiErrors";


export function toastApiErrors(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return;

  if (messages.length === 1) {
    toast.error(messages[0]);

    return;
  }

  toast.error(
    <ul className="m-0 list-none space-y-1.5 p-0">
      {messages.map((message) => (
        <li key={message} className="flex gap-2">
          <span aria-hidden="true" className="select-none opacity-60">
            •
          </span>
          <span>{message}</span>
        </li>
      ))}
    </ul>,
    { duration: Math.min(4000 + messages.length * 1200, 12000) }
  );
}

export function reportApiError(
  error,
  { fields = [], fallback = null, toastGlobal = true } = {}
) {
  const result = mapApiErrors(error, { fields, fallback });

  if (toastGlobal) toastApiErrors(result.globalErrors);

  return result;
}

export function reportFormikApiError(error, formik, fallback = null) {
  const fields = Object.keys(formik?.initialValues ?? {}).map((name) => ({
    name,
  }));

  const { fieldErrors, globalErrors, messages } = reportApiError(error, {
    fields,
    fallback,
  });

  Object.entries(joinFieldErrors(fieldErrors)).forEach(([name, message]) => {
    formik.setFieldTouched(name, true, false);

    formik.setFieldError(name, message);
  });

  return { fieldErrors, globalErrors, messages };
}

export default reportApiError;
