import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function BackButton({ className = "" }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className={`-ms-2 mb-4 inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-brand-50 hover:text-brand-900 ${className}`}
    >
      <ChevronRight size={18} />
      رجوع
    </button>
  );
}
