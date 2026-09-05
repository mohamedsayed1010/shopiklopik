import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import Seo from "../../components/Seo";
import { ChevronRight, Compass, House, Search } from "lucide-react";

import Button from "../../components/ui/Button";
import { AuthContext } from "../../context/AuthContext";

export default function NotFound() {
  const navigate = useNavigate();

  const { token } = useContext(AuthContext);

  /* The categories grid lives on the home page under this id; signed-out
     visitors have no home page to reach it on. */
  const goToCategories = () => {
    navigate("/");

    requestAnimationFrame(() => {
      document
        .getElementById("categories")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <>
      <Seo
        title="الصفحة غير موجودة"
        description="الرابط الذي فتحته غير موجود أو تم حذفه."
        robots="noindex, follow"
      />

      <div className="relative isolate flex min-h-[calc(100dvh-16rem)] items-center overflow-hidden px-4 py-16 sm:px-6 lg:py-24">
        {/* Ambient wash */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <span className="absolute -top-24 h-[420px] w-[420px] animate-blob-drift rounded-full bg-brand-200/50 blur-[110px] start-[-8rem]" />

          <span className="absolute -bottom-32 h-[380px] w-[380px] animate-blob-drift rounded-full bg-gold-200/50 blur-[110px] [animation-delay:-8s] end-[-6rem]" />
        </div>

        <div className="mx-auto w-full max-w-xl text-center">
          {/* Illustration */}
          <div className="relative mx-auto flex h-36 w-36 items-center justify-center sm:h-40 sm:w-40">
            <span
              aria-hidden="true"
              className="absolute inset-0 animate-breathe rounded-full bg-brand-100/70 blur-2xl"
            />

            <span
              aria-hidden="true"
              className="absolute inset-0 animate-slow-spin rounded-full border border-dashed border-brand-300/70"
            />

            <span
              aria-hidden="true"
              className="absolute inset-6 rounded-full bg-gradient-to-br from-surface to-brand-50 shadow-md"
            />

            {/* The compass needle keeps turning — nothing here points home. */}
            <Compass
              size={52}
              strokeWidth={1.3}
              aria-hidden="true"
              className="relative animate-float-soft text-brand-600"
            />
          </div>

          <p
            aria-hidden="true"
            className="tnum mt-8 bg-gradient-to-b from-brand-900 to-brand-400 bg-clip-text text-[76px] font-black leading-none tracking-tight text-transparent sm:text-[104px]"
          >
            404
          </p>

          <h1 className="mt-2 text-xl font-bold tracking-tight text-ink sm:text-2xl">
            هذه الصفحة غير موجودة
          </h1>

          <p className="mx-auto mt-3 max-w-md text-[14px] leading-7 text-muted sm:text-[15px]">
            ربما تم حذف الإعلان أو تغيّر الرابط. يمكنك العودة إلى الصفحة
            الرئيسية أو تصفّح الأقسام للوصول إلى ما تبحث عنه.
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-2.5 sm:flex-row sm:items-center sm:gap-3">
            <Button as={Link} to="/" variant="primary">
              <House size={18} strokeWidth={2.2} />
              الصفحة الرئيسية
            </Button>

            {token && (
              <Button variant="outline" onClick={goToCategories}>
                <Search size={17} strokeWidth={2.2} />
                تصفّح الأقسام
              </Button>
            )}

            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ChevronRight size={18} />
              رجوع
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
