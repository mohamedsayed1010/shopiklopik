
export const labelClass = "mb-2 block text-sm font-medium text-ink";

export const hintClass = "mt-1.5 text-xs leading-5 text-muted";

export const errorClass =
  "mt-1.5 flex items-start gap-1.5 text-xs font-medium leading-5 text-red-600";

export const inputBase =
  "w-full rounded-xl border bg-surface px-4 text-[15px] text-ink placeholder:text-muted/70 outline-none transition-[border-color,box-shadow] duration-150 disabled:cursor-not-allowed disabled:bg-canvas disabled:text-muted";

export const inputSize = "h-12";

export const inputIdle =
  "border-line-strong hover:border-brand-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12";

export const inputInvalid =
  "border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-4 focus:ring-red-500/12";

/** Build the class list for a text-like control. */
export function inputClass({ invalid = false, sized = true } = {}) {
  return [
    inputBase,
    sized ? inputSize : "",
    invalid ? inputInvalid : inputIdle,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Selects need extra inline-end room for the chevron. */
export function selectClass({ invalid = false } = {}) {
  return `${inputClass({ invalid })} cursor-pointer appearance-none pe-11`;
}
