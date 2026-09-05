import { Camera, KeyRound, LayoutGrid, MapPin, Pencil, Plus } from "lucide-react";
import { Link } from "react-router-dom";

import Button from "../../../components/ui/Button";
import ProfileAvatar from "./ProfileAvatar";
import { formatDate, formatNumber } from "../../../utils/format";

function Chip({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-[12.5px] font-medium text-brand-100 ring-1 ring-inset ring-white/15 backdrop-blur-sm">
      <Icon size={13} strokeWidth={2} aria-hidden="true" className="shrink-0" />
      {children}
    </span>
  );
}

export default function ProfileHeader({
  profile,
  statistics,
  avatarVersion,
  onEdit,
  onChangePassword,
  onChangePhoto,
}) {
  const fullName =
    [profile?.firstName, profile?.secondName].filter(Boolean).join(" ") ||
    profile?.username ||
    "حسابي";

  const memberSince = formatDate(profile?.createdAt);

  const place = [profile?.governorate, profile?.center].filter(Boolean).join(" — ");

  return (
    <section className="animate-fade-up overflow-hidden rounded-3xl border border-line bg-surface shadow-lg">
      {/* Cover */}
      <div className="relative h-40 bg-brand-900 sm:h-52 lg:h-56">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <span className="absolute -top-24 h-72 w-72 animate-blob-drift rounded-full bg-brand-500/40 blur-[90px] start-[-3rem]" />

          <span className="absolute -bottom-28 h-72 w-72 animate-blob-drift rounded-full bg-gold-400/25 blur-[90px] end-[-2rem]" />

          {/* A faint rule grid keeps the wash from looking like a gradient
              swatch — it gives the surface a material. */}
          <span
            className="absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.5) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage:
                "radial-gradient(120% 120% at 50% 0%, #000 20%, transparent 72%)",
              WebkitMaskImage:
                "radial-gradient(120% 120% at 50% 0%, #000 20%, transparent 72%)",
            }}
          />
        </span>

        <div className="absolute inset-x-0 bottom-4 flex flex-wrap justify-center gap-2 px-6 sm:justify-start sm:px-8 lg:bottom-5">
          {place && <Chip icon={MapPin}>{place}</Chip>}

          {Number.isFinite(Number(statistics?.totalListings)) && (
            <Chip icon={LayoutGrid}>
              {formatNumber(statistics.totalListings)} إعلان
            </Chip>
          )}
        </div>
      </div>

      {/* Identity row */}
      <div className="px-5 pb-6 sm:px-8 sm:pb-7">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:gap-6 sm:text-start">
          <div className="group relative -mt-16 sm:-mt-20">
            <span className="block rounded-full bg-surface p-1.5 shadow-lg ring-1 ring-line">
              {/* `size` is applied inline (the initials scale off it), so it
                  must be a single value — classes would be overridden. */}
              <ProfileAvatar
                src={profile?.profileImageUrl}
                name={fullName}
                bust={avatarVersion}
                size={112}
              />
            </span>

            <button
              type="button"
              onClick={onChangePhoto}
              aria-label="تغيير الصورة الشخصية"
              className="absolute bottom-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-brand-900 text-white shadow-md ring-4 ring-surface transition-[transform,background-color] duration-200 hover:scale-110 hover:bg-brand-800 active:scale-95 end-1"
            >
              <Camera size={17} strokeWidth={2} />
            </button>
          </div>

          <div className="min-w-0 flex-1 sm:pb-2">
            <h1 className="truncate text-[22px] font-bold leading-8 text-ink sm:text-[26px]">
              {fullName}
            </h1>

            <p className="mt-1 text-sm font-medium text-muted" dir="ltr">
              @{profile?.username}
            </p>

            {memberSince && (
              <p className="mt-1.5 text-[13px] text-muted">
                عضو منذ {memberSince}
              </p>
            )}
          </div>

          <div className="flex w-full flex-wrap items-center gap-2.5 sm:mb-2 sm:w-auto sm:justify-end">
            <Button
              size="sm"
              onClick={onEdit}
              className="min-w-0 flex-1 sm:flex-none"
            >
              <Pencil size={15} />
              تعديل البيانات
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={onChangePassword}
              className="min-w-0 flex-1 sm:flex-none"
            >
              <KeyRound size={15} />
              كلمة المرور
            </Button>

            <Button
              as={Link}
              to="/create-product"
              size="sm"
              variant="gold"
              className="min-w-0 flex-1 sm:flex-none"
            >
              <Plus size={16} />
              أضف إعلان
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
