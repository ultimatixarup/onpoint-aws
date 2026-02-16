import type React from "react";
import { useCallback, useMemo, useRef, useState } from "react";

type Validator<TValues> = (value: unknown, values: TValues) => string | null;

type Validators<TValues> = Partial<Record<keyof TValues, Validator<TValues>>>;

type ErrorMap<TValues> = Partial<Record<keyof TValues, string | null>>;

type TouchedMap<TValues> = Partial<Record<keyof TValues, boolean>>;

type FocusOptions<TValues> = {
  order?: Array<keyof TValues>;
  getId?: (field: keyof TValues) => string;
};

export function useEnterpriseForm<TValues extends Record<string, unknown>>(
  initialValues: TValues,
  validators: Validators<TValues> = {},
) {
  const initialRef = useRef(initialValues);
  const [values, setValues] = useState<TValues>(initialValues);
  const [errors, setErrors] = useState<ErrorMap<TValues>>({});
  const [touched, setTouched] = useState<TouchedMap<TValues>>({});

  const validateField = useCallback(
    (field: keyof TValues, value: unknown) => {
      const validator = validators[field];
      return validator ? validator(value, values) : null;
    },
    [validators, values],
  );

  const handleChange = useCallback(
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const { name, value, type } = event.target;
      const checked =
        event.target instanceof HTMLInputElement
          ? event.target.checked
          : false;
      setValues((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    },
    [],
  );

  const handleBlur = useCallback(
    (
      event: React.FocusEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const { name, value } = event.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name as keyof TValues, value),
      }));
    },
    [validateField],
  );

  const setFieldValue = useCallback(
    (field: keyof TValues, value: unknown) => {
      setValues((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const setFieldTouched = useCallback((field: keyof TValues, value = true) => {
    setTouched((prev) => ({ ...prev, [field]: value }));
  }, []);

  const validateAll = useCallback(() => {
    const nextErrors: ErrorMap<TValues> = {};
    (Object.keys(validators) as Array<keyof TValues>).forEach((field) => {
      const value = values[field];
      nextErrors[field] = validateField(field, value);
    });
    setErrors(nextErrors);
    const nextTouched: TouchedMap<TValues> = {};
    (Object.keys(validators) as Array<keyof TValues>).forEach((field) => {
      nextTouched[field] = true;
    });
    setTouched((prev) => ({ ...prev, ...nextTouched }));
    return nextErrors;
  }, [validators, validateField, values]);

  const isValid = useMemo(() => {
    const fields = Object.keys(validators) as Array<keyof TValues>;
    if (!fields.length) return true;
    return fields.every((field) => !validateField(field, values[field]));
  }, [validators, validateField, values]);

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initialRef.current),
    [values],
  );

  const resetForm = useCallback(
    (nextValues?: TValues) => {
      const resetValues = nextValues ?? initialRef.current;
      initialRef.current = resetValues;
      setValues(resetValues);
      setErrors({});
      setTouched({});
    },
    [],
  );

  const focusFirstInvalid = useCallback(
    (options: FocusOptions<TValues> = {}) => {
      const order =
        options.order ??
        (Object.keys(validators) as Array<keyof TValues>);
      const getId = options.getId ?? ((field) => String(field));
      for (const field of order) {
        if (errors[field]) {
          const element = document.getElementById(getId(field));
          if (element && "focus" in element) {
            (element as HTMLElement).focus();
            break;
          }
        }
      }
    },
    [errors, validators],
  );

  return {
    values,
    setValues,
    errors,
    setErrors,
    touched,
    setTouched,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldTouched,
    validateAll,
    isValid,
    isDirty,
    resetForm,
    focusFirstInvalid,
  } as const;
}
