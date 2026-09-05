import { FileQuestion } from "lucide-react";

import Seo from "../Seo";
import Skeleton from "../ui/Skeleton";
import PageHeader from "../ui/PageHeader";
import useSiteSettings from "../../hooks/useSiteSettings";

/** Blank-line-separated blocks, with the empties dropped. */
function toParagraphs(text) {
  return String(text ?? "")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function Prose({ children }) {
  return (
    <p className="whitespace-pre-line text-[15px] leading-8 text-ink-soft [overflow-wrap:anywhere]">
      {children}
    </p>
  );
}

export default function SettingsContentPage({
  field,
  title,
  eyebrow,
  icon: Icon,
  description,
  /** `[{ title, paragraphs }]` — shown only when the stored field is empty. */
  fallbackSections = null,
}) {
  const { settings, isLoading } = useSiteSettings();

  const paragraphs = toParagraphs(settings?.[field]);

  const siteName = settings.siteName || settings.siteNameEn;

  const usesFallback = !isLoading && paragraphs.length === 0 && Boolean(fallbackSections?.length);

  const hasContent = paragraphs.length > 0 || usesFallback;

  return (
    <>
      <Seo title={title} description={description} />

      <div className="mx-auto max-w-[820px] px-4 py-6 pb-20 sm:px-6 lg:py-10">
        <PageHeader eyebrow={eyebrow} title={title} subtitle={description} />

        <article className="mt-7 rounded-3xl border border-line bg-surface p-5 shadow-xs sm:p-8">
          {isLoading ? (
            <div className="space-y-3">
              {["w-full", "w-11/12", "w-full", "w-4/5", "w-full", "w-3/5"].map(
                (width, index) => (
                  <Skeleton key={index} className={`h-4 ${width}`} />
                )
              )}
            </div>
          ) : paragraphs.length ? (
            <div className="space-y-4">
              {paragraphs.map((paragraph, index) => (
                <Prose key={index}>{paragraph}</Prose>
              ))}
            </div>
          ) : usesFallback ? (
            /* Each section is a real heading, so the page has a hierarchy a
               reader and a crawler can both follow. */
            <div className="space-y-8">
              {fallbackSections.map((section) => (
                <section key={section.title} className="space-y-3">
                  <h2 className="text-[17px] font-bold leading-7 text-ink">
                    {section.title}
                  </h2>

                  {section.paragraphs.map((paragraph, index) => (
                    <Prose key={index}>{paragraph}</Prose>
                  ))}
                </section>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 ring-1 ring-inset ring-brand-100">
                <FileQuestion size={26} strokeWidth={1.7} aria-hidden="true" />
              </span>

              <h2 className="mt-5 text-base font-bold text-ink">
                لم يُنشر هذا المحتوى بعد
              </h2>

              <p className="mt-2 max-w-md text-sm leading-7 text-muted">
                لم تنشر إدارة المنصة نص «{title}» حتى الآن.
              </p>
            </div>
          )}
        </article>

        {Icon && hasContent && (
          <p className="mt-5 flex items-center justify-center gap-2 text-[12.5px] text-muted">
            <Icon size={14} aria-hidden="true" />
            {siteName}
          </p>
        )}
      </div>
    </>
  );
}
