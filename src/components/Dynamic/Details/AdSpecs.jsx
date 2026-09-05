import { ExternalLink, LayoutGrid, Sparkles } from "lucide-react";

import Panel from "./Panel";

function SpecTile({ spec }) {
  const Icon = spec.icon;

  return (
    <div className="group/tile relative flex items-start gap-3.5 rounded-2xl border border-line/70 bg-surface/60 p-4 transition-[border-color,background-color,transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white hover:shadow-md">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 transition-[background-color,color] duration-300 group-hover/tile:from-brand-900 group-hover/tile:to-brand-700 group-hover/tile:text-gold-300">
        <Icon size={17} strokeWidth={2} />
      </span>

      <div className="min-w-0 flex-1">
        <dt className="text-[12.5px] font-medium leading-5 text-muted">
          {spec.label}
        </dt>

        <dd className="mt-1 break-words text-[15px] font-bold leading-6 text-ink">
          {spec.href ? (
            <a
              href={spec.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-brand-700 underline decoration-brand-300 underline-offset-4 transition-colors hover:text-brand-900"
            >
              <span className="break-all">{spec.text}</span>
              <ExternalLink size={13} className="shrink-0" />
            </a>
          ) : (
            spec.text
          )}
        </dd>
      </div>
    </div>
  );
}

function SpecGrid({ items }) {
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((spec) => (
        <SpecTile key={spec.key} spec={spec} />
      ))}
    </dl>
  );
}

export default function AdSpecs({ groups = [], chipGroups = [], objectGroups = [] }) {
  const hasAnything =
    groups.length > 0 || chipGroups.length > 0 || objectGroups.length > 0;

  if (!hasAnything) return null;

  return (
    <div className="space-y-5">
      {groups.map((group, index) => (
        <Panel
          key={group.key}
          /* The first group carries the section heading for the whole block;
             the rest are named by the form section they came from. */
          title={group.title ?? (index === 0 ? "التفاصيل" : "معلومات إضافية")}
          icon={LayoutGrid}
        >
          <SpecGrid items={group.items} />
        </Panel>
      ))}

      {chipGroups.map((group) => (
        <Panel key={group.key} title={group.label} icon={Sparkles}>
          <ul className="flex flex-wrap gap-2.5">
            {group.chips.map((chip) => (
              <li
                key={chip}
                className="inline-flex items-center gap-2 rounded-full border border-line/80 bg-white/70 px-4 py-2 text-[13.5px] font-semibold text-ink-soft transition-[border-color,background-color,transform] duration-300 ease-out hover:-translate-y-0.5 hover:border-gold-300 hover:bg-gold-50"
              >
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-gold-400"
                />
                {chip}
              </li>
            ))}
          </ul>
        </Panel>
      ))}

      {objectGroups.map((group) => (
        <Panel key={group.key} title={group.label} icon={LayoutGrid}>
          <SpecGrid
            items={group.rows.map((row) => ({
              ...row,
              icon: row.icon ?? LayoutGrid,
            }))}
          />
        </Panel>
      ))}
    </div>
  );
}
