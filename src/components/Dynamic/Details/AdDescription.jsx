import { useEffect, useRef, useState } from "react";
import { ChevronDown, FileText } from "lucide-react";

import Panel from "./Panel";

/** Below this, collapsing costs more than it saves. */
const COLLAPSED_HEIGHT = 260;

export default function AdDescription({ text }) {
  const bodyRef = useRef(null);

  const [isExpanded, setExpanded] = useState(false);
  const [isOverflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const element = bodyRef.current;

    if (!element) return undefined;

    const measure = () =>
      setOverflowing(element.scrollHeight > COLLAPSED_HEIGHT + 24);

    measure();

    const observer = new ResizeObserver(measure);

    observer.observe(element);

    return () => observer.disconnect();
  }, [text]);

  if (!text) return null;

  const isCollapsed = isOverflowing && !isExpanded;

  return (
    <Panel title="الوصف" icon={FileText}>
      <div className="relative">
        <div
          ref={bodyRef}
          id="ad-description"
          style={isCollapsed ? { maxHeight: COLLAPSED_HEIGHT } : undefined}
          className={`whitespace-pre-line text-[15.5px] leading-[2.1] text-ink-soft transition-[max-height] duration-500 ease-out sm:max-w-[68ch] ${
            isCollapsed ? "overflow-hidden" : ""
          }`}
        >
          {text}
        </div>

        {isCollapsed && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/85 to-transparent"
          />
        )}
      </div>

      {isOverflowing && (
        <button
          type="button"
          onClick={() => setExpanded((expanded) => !expanded)}
          aria-expanded={isExpanded}
          aria-controls="ad-description"
          className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line-strong bg-white/80 px-4 py-2 text-[13px] font-bold text-brand-800 transition-[background-color,border-color,transform] duration-300 ease-out hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50 active:scale-95"
        >
          {isExpanded ? "عرض أقل" : "قراءة الوصف كاملاً"}

          <ChevronDown
            size={15}
            strokeWidth={2.4}
            className={`transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      )}
    </Panel>
  );
}
