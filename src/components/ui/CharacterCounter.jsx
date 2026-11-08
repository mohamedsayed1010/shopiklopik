import { lengthState } from "../../utils/interactionLimits";

/** "123/1000" under a text box — amber near the limit, red past it. */
export default function CharacterCounter({ text, max, id, className = "" }) {
  const state = lengthState(text, max);

  const tone = state.isOver
    ? "text-red-600 font-semibold"
    : state.isNear
      ? "text-amber-700 font-semibold"
      : "text-muted";

  return (
    <span
      id={id}
      dir="ltr"
      /* Announced only near the limit — not on every keystroke. */
      aria-live={state.isNear ? "polite" : "off"}
      className={`tnum text-[11.5px] ${tone} ${className}`}
    >
      {state.label}
    </span>
  );
}
