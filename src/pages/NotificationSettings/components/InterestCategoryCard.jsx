import { useState } from "react";
import { BellOff, Check, ChevronDown, Lock } from "lucide-react";

import Switch from "../../../components/ui/Switch";
import Spinner from "../../../components/ui/Spinner";
import getCategoryTheme, {
  categoryVars,
} from "../../../theme/categoryTheme";
import { interestKey } from "../../../components/Notifications/useNotificationInterests";


/** Checkbox in the app's existing form language (see CreateAd/FieldRenderer). */
function Tick({ checked, busy, disabled, onClick, label }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      aria-busy={busy || undefined}
      disabled={disabled || busy}
      onClick={onClick}
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-[background-color,border-color,transform] duration-200 active:scale-95 ${
        checked
          ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
          : "border-line-strong bg-surface text-transparent hover:border-[color:var(--accent)]"
      } ${disabled || busy ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
    >
      {busy ? (
        <Spinner size="sm" className="text-[color:var(--accent)]" />
      ) : (
        checked && <Check size={15} strokeWidth={3} />
      )}
    </button>
  );
}

export default function InterestCategoryCard({
  category,
  pendingKeys,
  onToggle,
  onSetEnabled,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const name = category.nameAr || category.name || "";

  const theme = getCategoryTheme(name);

  const Icon = theme.icon;

  const subCategories = category.subCategories ?? [];

  const selectedSubCount = subCategories.filter(
    (sub) => sub.isSelected && !sub.coveredByCategory
  ).length;

  const categoryKey = interestKey(category.categoryId, null);

  const isCategoryBusy = pendingKeys.has(categoryKey);

  // A followed category that has been muted still counts as followed — the
  // summary line has to say both things or the switch looks like it did nothing.
  const summary = category.isSelected
    ? category.isEnabled === false
      ? "القسم بالكامل — التنبيه مكتوم"
      : "متابَع بالكامل"
    : selectedSubCount > 0
    ? `${selectedSubCount} من ${subCategories.length} أقسام فرعية`
    : `${subCategories.length} أقسام فرعية`;

  return (
    <section
      style={categoryVars(theme)}
      className="accent-tile overflow-hidden rounded-2xl border border-line bg-surface shadow-xs transition-shadow duration-300 hover:shadow-md"
    >
      <div className="flex items-center gap-3 p-4">
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-xl"
            style={{ backgroundColor: "var(--accent-soft)" }}
          />

          <Icon
            size={21}
            strokeWidth={1.8}
            aria-hidden="true"
            className="relative text-[color:var(--accent)]"
          />
        </span>

        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-start"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold leading-6 text-ink">
              {name}
            </span>

            <span className="tnum mt-0.5 flex items-center gap-1.5 text-xs text-muted">
              {category.isSelected && category.isEnabled === false && (
                <BellOff size={12} aria-hidden="true" />
              )}
              {summary}
            </span>
          </span>

          <ChevronDown
            size={18}
            aria-hidden="true"
            className={`shrink-0 text-muted transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Mute only makes sense once the category is actually followed. */}
        {category.isSelected && category.interestId && (
          <Switch
            size="sm"
            checked={category.isEnabled !== false}
            busy={isCategoryBusy}
            label={`تنبيهات ${name}`}
            onChange={(next) =>
              onSetEnabled({
                id: category.interestId,
                isEnabled: next,
                key: categoryKey,
              })
            }
          />
        )}

        <Tick
          checked={Boolean(category.isSelected)}
          busy={isCategoryBusy}
          label={`متابعة قسم ${name} بالكامل`}
          onClick={() =>
            onToggle({
              categoryId: category.categoryId,
              subCategoryId: null,
              interestId: category.interestId,
              isSelected: category.isSelected,
            })
          }
        />
      </div>

      {isOpen && (
        <ul className="divide-y divide-line border-t border-line bg-canvas">
          {subCategories.length === 0 ? (
            <li className="px-4 py-4 text-[13px] text-muted">
              لا توجد أقسام فرعية في هذا القسم.
            </li>
          ) : (
            subCategories.map((sub) => {
              const subName = sub.nameAr || sub.name || "";

              const key = interestKey(category.categoryId, sub.subCategoryId);

              const isBusy = pendingKeys.has(key);

              const isCovered = Boolean(sub.coveredByCategory);

              return (
                <li
                  key={sub.subCategoryId}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">
                      {subName}
                    </span>

                    {isCovered && (
                      <span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-muted">
                        <Lock size={11} aria-hidden="true" />
                        مشمول ضمن متابعة القسم بالكامل
                      </span>
                    )}
                  </span>

                  {!isCovered && sub.isSelected && sub.interestId && (
                    <Switch
                      size="sm"
                      checked={sub.isEnabled !== false}
                      busy={isBusy}
                      label={`تنبيهات ${subName}`}
                      onChange={(next) =>
                        onSetEnabled({
                          id: sub.interestId,
                          isEnabled: next,
                          key,
                        })
                      }
                    />
                  )}

                  <Tick
                    checked={isCovered || Boolean(sub.isSelected)}
                    busy={isBusy}
                    disabled={isCovered}
                    label={`متابعة ${subName}`}
                    onClick={() =>
                      onToggle({
                        categoryId: category.categoryId,
                        subCategoryId: sub.subCategoryId,
                        interestId: sub.interestId,
                        isSelected: sub.isSelected,
                      })
                    }
                  />
                </li>
              );
            })
          )}
        </ul>
      )}
    </section>
  );
}
