import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const maxWidth =
    size === "sm" ? "max-w-md" : size === "lg" ? "max-w-3xl" : "max-w-xl";

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-950/50 backdrop-blur-[2px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`relative flex max-h-[92dvh] w-full ${maxWidth} flex-col overflow-hidden rounded-t-3xl bg-surface-elevated shadow-xl sm:max-h-[88vh] sm:rounded-3xl`}
          >
            {/* Sheet grabber — signals "drag/tap away to dismiss" on phones */}
            <div
              aria-hidden="true"
              className="flex justify-center pt-2.5 sm:hidden"
            >
              <span className="h-1 w-10 rounded-full bg-line-strong" />
            </div>

            {(title || onClose) && (
              <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6 sm:py-5">
                <div className="min-w-0">
                  {title && (
                    <h2 className="text-[17px] font-bold text-ink sm:text-lg">
                      {title}
                    </h2>
                  )}

                  {description && (
                    <p className="mt-1 text-[13px] leading-6 text-muted sm:text-sm">
                      {description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="إغلاق"
                  className="-me-1.5 -mt-1 shrink-0 cursor-pointer rounded-lg p-2 text-muted transition-colors duration-200 hover:bg-brand-50 hover:text-ink"
                >
                  <X size={20} />
                </button>
              </header>
            )}

            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              {children}
            </div>

            {footer && (
              <footer className="border-t border-line bg-canvas px-5 py-4 safe-bottom sm:px-6">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
