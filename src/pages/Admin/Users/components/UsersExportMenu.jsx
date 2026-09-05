import { useState } from "react";
import { ChevronDown, Download, FileSpreadsheet, Printer } from "lucide-react";
import toast from "react-hot-toast";

import Button from "../../../../components/ui/Button";
import { exportUsersToExcel, exportUsersToPdf } from "../usersExport";

export default function UsersExportMenu({ users = [], subtitle = "" }) {
  const [isOpen, setOpen] = useState(false);

  const [isBusy, setBusy] = useState(false);

  const count = users.length;

  const handleExcel = async () => {
    setOpen(false);

    if (isBusy) return;

    setBusy(true);

    try {
      await exportUsersToExcel(users);

      toast.success(`تم تصدير ${count} حسابًا إلى Excel`);
    } catch {
      toast.error("تعذّر تصدير الملف. حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  };

  const handlePdf = () => {
    setOpen(false);

    /* The browser's own print dialog produces the PDF — see `usersExport` for
       why that is what keeps the Arabic correct. */
    const opened = exportUsersToPdf(users, {
      title: "المستخدمون",
      subtitle,
    });

    if (!opened) {
      toast.error("تعذّر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.");
    }
  };

  return (
    <div className="relative shrink-0">
      <Button
        variant="outline"
        size="sm"
        disabled={count === 0 || isBusy}
        loading={isBusy}
        onClick={() => setOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <Download size={15} />
        تصدير
        <ChevronDown size={14} aria-hidden="true" />
      </Button>

      {isOpen && (
        <>
          {/* Tapping anywhere else closes it — no outside-click listener. */}
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />

          <div
            role="menu"
            className="absolute end-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              onClick={handleExcel}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-semibold text-ink transition-colors duration-200 hover:bg-canvas"
            >
              <FileSpreadsheet size={15} strokeWidth={2} aria-hidden="true" />
              تصدير Excel
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={handlePdf}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-semibold text-ink transition-colors duration-200 hover:bg-canvas"
            >
              <Printer size={15} strokeWidth={2} aria-hidden="true" />
              تصدير PDF
            </button>

            <p className="border-t border-line px-3.5 pb-1.5 pt-2 text-[11.5px] leading-5 text-muted">
              يُصدَّر ما هو معروض في هذه الصفحة فقط ({count}).
            </p>
          </div>
        </>
      )}
    </div>
  );
}
