import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  buildFormData,
  createInitialValues,
  getSections,
  isFieldRequired,
  pruneHiddenValues,
  validateFields,
} from "../../utils/dynamicForm";

export default function useDynamicForm(
  fields = [],
  context = null,
  initialValues = null,
  satisfiedFields = null
) {
  const [values, setValues] = useState(
    () => initialValues ?? createInitialValues(fields)
  );

  const [touched, setTouched] = useState({});

  // Errors stay hidden until a field is touched, or until submit is attempted.
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const signature = useMemo(
    () => fields.map((field) => field.name).join("|"),
    [fields]
  );

  const previous = useRef({ signature, initialValues });

  useEffect(() => {
    if (
      previous.current.signature === signature &&
      previous.current.initialValues === initialValues
    ) {
      return;
    }

    previous.current = { signature, initialValues };

    setValues(initialValues ?? createInitialValues(fields));

    setTouched({});

    setSubmitAttempted(false);
  }, [signature, fields, initialValues]);

  const handleChange = useCallback(
    (name, value) => {
      setValues((previous) => {
        const resolved =
          typeof value === "function" ? value(previous[name]) : value;

        const next = { ...previous, [name]: resolved };

        /* Changing a parent can close a conditional branch. Clearing the
           orphaned values keeps state and UI in agreement, and keeps a value
           the user can no longer see out of the payload. */
        return pruneHiddenValues(fields, next);
      });

      setTouched((previous) =>
        previous[name] ? previous : { ...previous, [name]: true }
      );
    },
    [fields]
  );

  const handleBlur = useCallback((name) => {
    setTouched((previous) =>
      previous[name] ? previous : { ...previous, [name]: true }
    );
  }, []);

  const errors = useMemo(
    () => validateFields(fields, values, satisfiedFields),
    [fields, values, satisfiedFields]
  );

  /** Errors the user should actually see right now. */
  const visibleErrors = useMemo(() => {
    if (submitAttempted) return errors;

    return Object.fromEntries(
      Object.entries(errors).filter(([name]) => touched[name])
    );
  }, [errors, touched, submitAttempted]);

  const sections = useMemo(() => getSections(fields, values), [fields, values]);

  const requiredFor = useCallback(
    (field) => isFieldRequired(field, values),
    [values]
  );

  /** Marks the form as submitted and reports whether it may proceed. */
  const validate = useCallback(() => {
    setSubmitAttempted(true);

    return Object.keys(errors).length === 0;
  }, [errors]);

  /** Back to what the form opened with — empty on create, the record on edit. */
  const resetForm = useCallback(() => {
    setValues(initialValues ?? createInitialValues(fields));

    setTouched({});

    setSubmitAttempted(false);
  }, [fields, initialValues]);

  return {
    values,
    errors,
    visibleErrors,
    sections,

    handleChange,
    handleBlur,
    requiredFor,
    validate,
    resetForm,

    buildFormData: useCallback(
      () => buildFormData(fields, values, context),
      [fields, values, context]
    ),
  };
}
