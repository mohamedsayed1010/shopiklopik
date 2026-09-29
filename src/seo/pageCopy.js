/**
 * The visible copy the public catalogue pages open with, and the FAQ page's
 * questions and answers.
 *
 * Shared by the React pages and `scripts/prerender.mjs`, so the HTML a crawler
 * is served and the page a visitor sees say the same thing. Every sentence is
 * built from what the application already holds — the category tree, the brand
 * name, the behaviour of its own routes — and states nothing about the size,
 * popularity or quality of the marketplace.
 */

import { APP_NAME } from "../utils/brand.js";

/** Where the marketplace operates. Worded as the web manifest words it. */
export const MARKET_SCOPE = "سوق إلكتروني يربط بين المشترين والبائعين داخل محافظة الفيوم";

/** "قسم واحد", "قسمان", "3 أقسام", "11 قسمًا" — Arabic number agreement. */
export function sectionCount(count) {
  const n = Number(count);

  if (!Number.isFinite(n) || n < 1) return "";

  if (n === 1) return "قسمًا فرعيًا واحدًا";

  if (n === 2) return "قسمين فرعيين";

  if (n <= 10) return `${n} أقسام فرعية`;

  return `${n} قسمًا فرعيًا`;
}

/** The first thing a category page says: what it is and what it holds. */
export function categoryLead({ categoryName, subCategoryCount }) {
  if (!categoryName) return "";

  const holds = sectionCount(subCategoryCount);

  return [
    `«${categoryName}» أحد الأقسام الرئيسية في ${APP_NAME}، ${MARKET_SCOPE}.`,
    holds ? `يضم ${holds}؛ اختر أحدها لتصفّح الإعلانات المنشورة فيه.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/** The first thing a section page says: where it sits and what it lists. */
export function sectionLead({ categoryName, subCategoryName }) {
  if (!subCategoryName) return "";

  const within = categoryName ? ` ضمن قسم «${categoryName}»` : "";

  return `«${subCategoryName}» قسم فرعي${within} في ${APP_NAME}، ${MARKET_SCOPE}. تعرض هذه الصفحة ما نُشر فيه حاليًا بعد مراجعة الإدارة.`;
}

/** The FAQ page's heading and description, shared with its prerendered
    document. The description names only what the questions below cover. */
export const FAQ_TITLE = "الأسئلة الشائعة";

export const FAQ_DESCRIPTION = `إجابات عن الأسئلة الشائعة حول ${APP_NAME}: تصفّح الإعلانات، ونشر إعلان، والتواصل مع المُعلن، وحذف الحساب.`;

/**
 * The FAQ page's questions. Each answer describes what the application
 * itself does — the sign-in wall on a listing, the review step before
 * publishing, the contact option a listing page shows — and is rendered on the
 * page, not only in the structured data.
 */
export const FAQ_ENTRIES = [
  {
    question: `ما هو ${APP_NAME}؟`,
    answer: `${APP_NAME} ${MARKET_SCOPE}. تُعرض الإعلانات مرتبة في أقسام رئيسية، ويتفرع كل قسم إلى أقسام فرعية.`,
  },
  {
    question: "هل أحتاج إلى حساب لتصفّح الإعلانات؟",
    answer:
      "لا. يمكنك تصفّح الأقسام وقوائم الإعلانات دون حساب. أما فتح صفحة الإعلان الكاملة بتفاصيلها فيتطلب تسجيل الدخول.",
  },
  {
    question: "كيف أنشر إعلانًا؟",
    answer:
      "سجّل الدخول، ثم اضغط «أضف إعلانك» واختر القسم الرئيسي ثم القسم الفرعي واملأ بيانات الإعلان. يمر كل إعلان جديد بمراجعة من الإدارة قبل ظهوره للزوّار.",
  },
  {
    question: "كيف أتواصل مع المُعلن؟",
    answer:
      "من صفحة الإعلان بعد تسجيل الدخول، عبر وسيلة التواصل التي يعرضها الإعلان مثل المراسلة على واتساب.",
  },
  {
    question: "كيف أحذف حسابي؟",
    answer:
      "من صفحة «حذف الحساب»، وهي تشرح خطوات الحذف وما يترتب عليه.",
    link: { href: "/delete-account", label: "حذف الحساب" },
  },
];
