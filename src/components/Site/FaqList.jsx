import { Link } from "react-router-dom";

import { FAQ_ENTRIES } from "../../seo/pageCopy";

/**
 * How the marketplace works, in the questions people ask about it.
 *
 * The same entries the FAQ page's FAQPage structured data publishes and the
 * prerendered /faq document prints — see `seo/pageCopy.js`. Every answer is
 * visible, never collapsed, and describes only what the application does.
 * The heading belongs to the page that renders the list.
 */
export default function FaqList() {
  return (
    <dl className="grid gap-3 sm:gap-4 lg:grid-cols-2">
      {FAQ_ENTRIES.map((entry) => (
        <div
          key={entry.question}
          className="rounded-2xl border border-line bg-surface p-4 shadow-xs sm:p-5"
        >
          <dt className="text-[15px] font-bold leading-7 text-ink">
            {entry.question}
          </dt>

          <dd className="mt-1.5 text-sm leading-7 text-muted">
            {entry.answer}

            {entry.link && (
              <>
                {" "}
                <Link
                  to={entry.link.href}
                  className="font-semibold text-brand-600 hover:underline"
                >
                  {entry.link.label}
                </Link>
              </>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
