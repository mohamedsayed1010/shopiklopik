import { NavLink } from "react-router-dom";
import { Home, CircleUserRound, Plus } from "lucide-react";
import useCreateAdTarget from "../../hooks/useCreateAdTarget";

const itemClass = ({ isActive }) =>
  `flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
    isActive ? "text-brand-900" : "text-muted hover:text-brand-700"
  }`;

export default function BottomNav() {
  /* Opens the form already on the section being browsed — see
     `useCreateAdTarget`. Falls back to the general flow everywhere else. */
  const createAdTarget = useCreateAdTarget();

  return (
    <>
      {/* Reserves the space the fixed bar occupies. */}
      <div className="h-16 safe-bottom lg:hidden" aria-hidden="true" />

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md safe-bottom lg:hidden">
        <div className="grid grid-cols-3">
          <NavLink to="/" end className={itemClass}>
            <Home size={21} strokeWidth={1.9} />
            الرئيسية
          </NavLink>

          <NavLink
            to={createAdTarget}
            className="flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-semibold text-brand-900"
          >
            <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-gold-300 shadow-md ring-4 ring-surface">
              <Plus size={24} strokeWidth={2.5} className="text-brand-900" />
            </span>
            أضف إعلان
          </NavLink>

          <NavLink to="/profile" className={itemClass}>
            <CircleUserRound size={21} strokeWidth={1.9} />
            حسابي
          </NavLink>
        </div>
      </nav>
    </>
  );
}
