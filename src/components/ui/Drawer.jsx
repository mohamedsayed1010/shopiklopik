import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export default function Drawer({
  open,
  onClose,
  side = "start",
  title,
  width = "max-w-[340px]",
  children,
  className = "",
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

  const isRtl =
    typeof document !== "undefined" &&
    document.documentElement.dir === "rtl";

  // Translate away from the physical edge the panel is pinned to.
  const startIsRight = isRtl;
  const pinnedRight = side === "start" ? startIsRight : !startIsRight;
  const offset = pinnedRight ? "100%" : "-100%";

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-950/50 backdrop-blur-[2px]"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: offset }}
            animate={{ x: 0 }}
            exit={{ x: offset }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute inset-y-0 ${
              side === "start" ? "start-0" : "end-0"
            } flex w-[86%] ${width} flex-col bg-surface-elevated shadow-xl ${className}`}
          >
            {title && (
              <header className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="text-base font-semibold text-ink">{title}</h2>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="إغلاق"
                  className="-me-2 cursor-pointer rounded-lg p-2 text-muted transition-colors hover:bg-brand-50 hover:text-ink"
                >
                  <X size={20} />
                </button>
              </header>
            )}

            {children}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
