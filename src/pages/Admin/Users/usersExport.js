import { formatDate } from "../../../utils/format";

export const USER_EXPORT_COLUMNS = [
  { header: "الاسم", width: 24, value: (user) => user?.name || "" },
  {
    header: "اسم المستخدم",
    width: 20,
    value: (user) => (user?.userName ? `@${user.userName}` : ""),
  },
  { header: "رقم الهاتف", width: 16, value: (user) => user?.phone || "" },
  { header: "البريد الإلكتروني", width: 30, value: (user) => user?.email || "" },
  {
    header: "الإعلانات",
    width: 11,
    value: (user) => Number(user?.adsCount ?? 0),
  },
  { header: "الحالة", width: 14, value: (user) => user?.statusName || "" },
  {
    header: "النوع",
    width: 12,
    value: (user) => (user?.isAdmin ? "مسؤول" : "مستخدم"),
  },
  {
    header: "تاريخ التسجيل",
    width: 18,
    value: (user) => formatDate(user?.createdAt) || "",
  },
];

/** `users-2026-08-30` — enough to tell two exports apart without a clock. */
function stamp() {
  const now = new Date();

  const pad = (part) => String(part).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export async function exportUsersToExcel(users) {
  const rows = Array.isArray(users) ? users : [];

  if (rows.length === 0) return;

  const { default: writeXlsxFile } = await import("write-excel-file/browser");

  await writeXlsxFile(rows, {
    columns: USER_EXPORT_COLUMNS.map((column) => ({
      header: column.header,
      width: column.width,
      cell: (user) => ({ value: column.value(user) }),
    })),
    sheet: "المستخدمون",
    // Arabic: open the sheet laid out right-to-left, as the table is.
    rightToLeft: true,
  }).toFile(`users-${stamp()}.xlsx`);
}

/** Row data is the server's, so it is escaped before it becomes markup. */
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function printableDocument(rows, { title, subtitle }) {
  const head = USER_EXPORT_COLUMNS.map(
    (column) => `<th>${escapeHtml(column.header)}</th>`
  ).join("");

  const body = rows
    .map(
      (user) =>
        `<tr>${USER_EXPORT_COLUMNS.map(
          (column) => `<td>${escapeHtml(column.value(user))}</td>`
        ).join("")}</tr>`
    )
    .join("");

  /* Self-contained: the print window shares no stylesheet with the app, so
     everything it needs is inline. `dir="rtl"` and an Arabic-capable font
     stack are what make the shaping and the column order correct. */
  return `<!doctype html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "Segoe UI", Tahoma, "Noto Naskh Arabic", "Arial", sans-serif;
    color: #111827;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  h1 { margin: 0 0 4px; font-size: 18px; }
  p  { margin: 0 0 14px; font-size: 12px; color: #6b7280; }
  table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
  /* Repeat the header on every printed page. */
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th, td {
    border: 1px solid #d1d5db;
    padding: 6px 8px;
    text-align: right;
    vertical-align: middle;
  }
  th { background: #f3f4f6; font-weight: 700; }
  tbody tr:nth-child(even) { background: #fafafa; }
</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(subtitle)}</p>
  <table>
    <thead><tr>${head}</tr></thead>
    <tbody>${body}</tbody>
  </table>
</body>
</html>`;
}

export function exportUsersToPdf(users, { title, subtitle } = {}) {
  const rows = Array.isArray(users) ? users : [];

  if (rows.length === 0) return true;

  /* No `noopener`: the handle is needed to write into the window and print it.
     The document is written by this app, not navigated to a third party. */
  const printWindow = window.open("", "_blank", "width=1100,height=800");

  if (!printWindow) return false;

  printWindow.document.write(
    printableDocument(rows, {
      title: title || "المستخدمون",
      subtitle: subtitle || "",
    })
  );

  printWindow.document.close();

  /* Print once the document has settled, so the table is laid out and its font
     has loaded before the dialog samples the page. */
  const print = () => {
    printWindow.focus();

    printWindow.print();
  };

  if (printWindow.document.readyState === "complete") print();
  else printWindow.addEventListener("load", print);

  /* Closing after the dialog is dismissed — cancelled or saved — leaves no
     stray tab behind. */
  printWindow.addEventListener("afterprint", () => printWindow.close());

  return true;
}
