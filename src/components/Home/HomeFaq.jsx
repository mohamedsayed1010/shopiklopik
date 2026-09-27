import { Link } from "react-router-dom";

import { HOME_FAQ } from "../../seo/pageCopy";

/**
 * How the marketplace works, in the questions people ask about it.
 *
 * The same entries the home page's FAQPage structured data publishes and the
 * prerendered home document prints — see `seo/pageCopy.js`. Every answer is
 * visible, never collapsed, and describes only what the application does.
 */
export default function HomeFaq() {
  return (
    <section aria-labelledby="home-faq-title" className="[content-visibility:auto] [contain-intrinsic-size:auto_640px]">
      <div className="relative mb-7 ps-4">
        <span
          aria-hidden="true"
          className="absolute inset-y-1 w-1 rounded-full bg-gradient-to-b from-gold-300 to-brand-900 start-0"
        />

        <h2 id="home-faq-title" className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
          أسئلة شائعة
        </h2>
      </div>

      <dl className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        {HOME_FAQ.map((entry) => (
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
    </section>
  );
}
