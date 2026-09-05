
export const APP_NAME = "شوبيك لوبيك";

const LEGACY_APP_NAMES = ["شبيك لبيك"];

export function normalizeBrand(value) {
  if (typeof value !== "string" || !value) return value;

  return LEGACY_APP_NAMES.reduce(
    (text, legacy) => (text.includes(legacy) ? text.split(legacy).join(APP_NAME) : text),
    value
  );
}

export default APP_NAME;
