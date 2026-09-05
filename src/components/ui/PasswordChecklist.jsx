import { Check } from "lucide-react";

const RULES = [
  { label: "8 أحرف على الأقل", test: (value) => value.length >= 8 },
  {
    label: "حرف كبير وصغير",
    test: (value) => /[a-z]/.test(value) && /[A-Z]/.test(value),
  },
  { label: "رقم", test: (value) => /\d/.test(value) },
  { label: "رمز خاص", test: (value) => /[@$!%*?&.#_-]/.test(value) },
];

export default function PasswordChecklist({ value = "", className = "" }) {
  return (
    <ul className={`flex flex-wrap gap-x-4 gap-y-2 ${className}`}>
      {RULES.map((rule) => {
        const passed = rule.test(value);

        return (
          <li
            key={rule.label}
            className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
              passed ? "font-medium text-green-700" : "text-muted"
            }`}
          >
            <span
              aria-hidden="true"
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
                passed ? "bg-green-600 text-white" : "border border-line-strong"
              }`}
            >
              {passed && <Check size={10} strokeWidth={3.5} />}
            </span>

            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
