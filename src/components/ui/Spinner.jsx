const SIZES = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
};

export default function Spinner({ size = "md", className = "" }) {
  return (
    <span
      role="status"
      aria-label="جارٍ التحميل"
      className={`inline-block animate-spin rounded-full border-current border-t-transparent ${SIZES[size]} ${className}`}
    />
  );
}

export function PageSpinner({ label = "جارٍ التحميل..." }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-brand-500">
      <Spinner size="lg" />
      <p className="text-sm font-medium text-muted">{label}</p>
    </div>
  );
}
