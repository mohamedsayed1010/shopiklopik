import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, MapPin, Siren, Timer } from "lucide-react";

import useUrgentCharityRequests from "../../hooks/useUrgentCharityRequests";
import {
  formatCountdown,
  urgentRequestModel,
} from "../../utils/charityUrgency";

const ROTATE_MS = 5000;

const ROTATING_MIN_HEIGHT = "min-h-[3.25rem]";

function UrgentRow({ item, remainingMs }) {
  const model = urgentRequestModel(item);

  /* Who and what, on one line: "طلب فصيلة الدم · A+ · محمد" reads as a whole
     even truncated, because the two most scannable parts come first. */
  const lead = [model.kind, model.highlight, model.name]
    .filter(Boolean)
    .join(" · ");

  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[13px] font-bold sm:text-sm">{lead}</span>

          {model.body && (
            <span className="hidden min-w-0 flex-1 truncate text-[12.5px] text-white/75 sm:inline">
              {model.body}
            </span>
          )}
        </span>

        {model.place && (
          <span className="mt-0.5 flex items-center gap-1 text-[11.5px] text-white/80 sm:text-[12px]">
            <MapPin size={12} strokeWidth={2} aria-hidden="true" className="shrink-0" />
            <span className="truncate">{model.place}</span>
          </span>
        )}
      </span>

      {/* The clock. `tabular-nums` stops the row shifting every second. */}
      <span
        className="flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[12px] font-bold tabular-nums text-white ring-1 ring-inset ring-white/25"
        title="الوقت المتبقي"
      >
        <Timer size={13} strokeWidth={2.2} aria-hidden="true" />
        {formatCountdown(remainingMs)}
      </span>

      {model.href && (
        <span className="hidden shrink-0 items-center gap-1 text-[12.5px] font-semibold text-white/90 md:flex">
          عرض التفاصيل
          <ChevronLeft
            size={15}
            strokeWidth={2.4}
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:-translate-x-0.5"
          />
        </span>
      )}
    </>
  );

  const shared = "group flex w-full items-center gap-2.5 py-2 text-right sm:gap-3";

  /* A row with no coordinates to open is shown but not clickable, exactly as
     an unresolvable notification is — the emergency is still worth reading. */
  return (
    <li className="motion-safe:animate-urgent-swap">
      {model.href ? (
        <Link
          to={model.href}
          className={`${shared} rounded-lg px-1 outline-none transition-colors duration-200 hover:bg-white/10 focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60`}
        >
          {body}
        </Link>
      ) : (
        <div className={`${shared} px-1`}>{body}</div>
      )}
    </li>
  );
}

export default function UrgentBar() {
  const rows = useUrgentCharityRequests();

  const [activeId, setActiveId] = useState(null);

  const [isHeld, setIsHeld] = useState(false);

  const rowsRef = useRef(rows);

  const count = rows.length;

  /* `-1` — nothing chosen yet, or the chosen request has since expired — means
     the top of the list, which is the soonest deadline. */
  const index = Math.max(
    0,
    rows.findIndex((row) => row.item.id === activeId)
  );

  const current = rows[index];

  /* A single request is shown plainly. Nothing rotates, no timer runs, and no
     carousel affordance appears for a list of one. */
  const isRotating = count > 1 && !isHeld;

  useEffect(() => {
    if (!isRotating) return undefined;

    const timer = setInterval(() => {
      setActiveId((currentId) => {
        const list = rowsRef.current;

        if (list.length === 0) return null;

        /* `-1 + 1` is `0`, so a request that expired while it was on screen
           hands the bar to the top of the list rather than to nothing. */
        const at = list.findIndex((row) => row.item.id === currentId);

        return list[(at + 1) % list.length].item.id;
      });
    }, ROTATE_MS);

    return () => clearInterval(timer);
  }, [isRotating]);

  const seenIds = useRef(new Set());

  /* `null` is "nothing to play"; any number is a burst. */
  const [flashKey, setFlashKey] = useState(null);

  useEffect(() => {
    rowsRef.current = rows;

    const ids = rows.map((row) => row.item.id);

    const hasNew = ids.some((id) => !seenIds.current.has(id));

    /* Kept to exactly what is live, so the set cannot grow all session and a
       request that leaves and comes back is new again — which it is. */
    seenIds.current = new Set(ids);

    if (hasNew) setFlashKey((key) => (key ?? 0) + 1);
  }, [rows]);

  if (count === 0) return null;

  return (
    <aside
      aria-label="طلبات عاجلة"
      className="relative border-b border-red-900/40 bg-red-700 text-white shadow-sm print:hidden"
      onMouseEnter={() => setIsHeld(true)}
      onMouseLeave={() => setIsHeld(false)}
      onFocus={() => setIsHeld(true)}
      onBlur={() => setIsHeld(false)}
    >
      {flashKey !== null && (
        <span
          key={flashKey}
          aria-hidden="true"
          onAnimationEnd={() => setFlashKey(null)}
          className="pointer-events-none absolute inset-0 z-10 bg-white/25 opacity-0 motion-safe:animate-urgent-flash"
        />
      )}

      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-1.5 sm:gap-4 sm:px-6 lg:px-8">
        <span className="mt-2 flex shrink-0 items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-extrabold tracking-wide text-[#b42318] shadow-xs">
          <Siren
            size={13}
            strokeWidth={2.4}
            aria-hidden="true"
            className="animate-pulse"
          />
          عاجل
        </span>

        <ul
          className={`min-w-0 flex-1 ${count > 1 ? ROTATING_MIN_HEIGHT : ""}`}
        >
          {/* One request at a time. The key is the id, so handing the bar to
              the next one remounts the row and replays the swap. */}
          <UrgentRow
            key={current.item.id}
            item={current.item}
            remainingMs={current.remainingMs}
          />
        </ul>

        {/* Only meaningful when there is something to rotate between: it says
            how many other emergencies are live and which one this is. */}
        {count > 1 && (
          <span
            className="mt-2 shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[11.5px] font-bold tabular-nums text-white ring-1 ring-inset ring-white/25"
            aria-label={`طلب ${index + 1} من ${count}`}
          >
            {index + 1}/{count}
          </span>
        )}
      </div>
    </aside>
  );
}
