import { Toaster, resolveValue, toast } from "react-hot-toast";
import { CircleCheck, CircleX, Info, TriangleAlert, X } from "lucide-react";

const VARIANTS = {
  success: {
    icon: CircleCheck,
    accent: "#059669",
    tint: "#e7f6f0",
  },
  error: {
    icon: CircleX,
    accent: "#dc2626",
    tint: "#fdeceb",
  },
  warning: {
    icon: TriangleAlert,
    accent: "#d97706",
    tint: "#fdf3e3",
  },
  info: {
    icon: Info,
    accent: "#23426c",
    tint: "#e9eef5",
  },
};

const DEFAULT_DURATION = 4000;

function resolveVariant(t) {
  if (typeof t.icon === "string" && VARIANTS[t.icon]) return t.icon;

  if (t.type === "success" || t.type === "error") return t.type;

  return "info";
}

function AppToast({ t }) {
  const variant = resolveVariant(t);

  const { icon: Icon, accent, tint } = VARIANTS[variant];

  const message = resolveValue(t.message, t);

  const isLoading = t.type === "loading";

  // Infinity for loading toasts — no bar to show when there is no deadline.
  const duration = Number.isFinite(t.duration) ? t.duration : null;

  return (
    <div
      {...t.ariaProps}
      style={{ "--toast-accent": accent, "--toast-tint": tint }}
      className={`group pointer-events-auto relative flex w-[calc(100vw-2rem)] max-w-[26rem] items-start gap-3 overflow-hidden rounded-2xl border border-line bg-surface/95 p-3.5 shadow-lg backdrop-blur-sm ${
        t.visible ? "animate-toast-in" : "animate-toast-out"
      }`}
    >
      {/* Accent rail — the colour cue that survives even at a glance. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 w-1 bg-[color:var(--toast-accent)] start-0"
      />

      <span
        aria-hidden="true"
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[color:var(--toast-accent)]"
        style={{ backgroundColor: "var(--toast-tint)" }}
      >
        {isLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Icon size={18} strokeWidth={2.2} />
        )}
      </span>

      <div className="min-w-0 flex-1 py-1 text-[14px] font-medium leading-6 text-ink [overflow-wrap:anywhere]">
        {message}
      </div>

      <button
        type="button"
        onClick={() => toast.dismiss(t.id)}
        aria-label="إغلاق التنبيه"
        className="-me-1 mt-0.5 shrink-0 cursor-pointer rounded-lg p-1.5 text-muted transition-colors duration-150 hover:bg-canvas hover:text-ink"
      >
        <X size={15} strokeWidth={2.2} />
      </button>

      {duration && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[3px] origin-right animate-toast-progress bg-[color:var(--toast-accent)] opacity-30 group-hover:[animation-play-state:paused]"
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </div>
  );
}

export default function AppToaster() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={12}
      // Clears the 64px sticky header so a toast never covers the nav.
      containerStyle={{ top: 76 }}
      toastOptions={{ duration: DEFAULT_DURATION }}
    >
      {(t) => <AppToast t={t} />}
    </Toaster>
  );
}
