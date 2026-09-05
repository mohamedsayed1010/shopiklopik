import { useMemo, useState } from "react";
import Seo from "../../components/Seo";

import useProfile from "./useProfile";
import useListingRoutes from "../../hooks/useListingRoutes";

import ProfileHeader from "./components/ProfileHeader";
import ProfileInfoCard from "./components/ProfileInfoCard";
import ProfileSkeleton from "./components/ProfileSkeleton";
import SecurityCard from "./components/SecurityCard";
import StatCards from "./components/StatCards";
import TypeBreakdown from "./components/TypeBreakdown";
import MyListingsSection from "./components/MyListingsSection";
import AvatarUploader from "./components/AvatarUploader";

import EditProfileModal from "./updateprofile/EditProfileModal";
import ChangePasswordModal from "./Changepassword/ChangePasswordModal";
import ErrorState from "../../components/ui/ErrorState";

export default function Profile() {
  const { profile, statistics, isLoading, isError, refetch } = useProfile();

  const [showEdit, setShowEdit] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showAvatarUploader, setShowAvatarUploader] = useState(false);

  const [avatarVersion, setAvatarVersion] = useState(0);

  const byType = statistics?.byType;

  const typeNames = useMemo(
    () => (Array.isArray(byType) ? byType.map((entry) => entry?.type) : []),
    [byType]
  );

  const { resolve } = useListingRoutes(typeNames);

  return (
    <>
      <Seo title="الملف الشخصي" />

      {/* Ambient wash. The glass cards need something behind them to frost. */}
      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] overflow-hidden"
        >
          <span className="absolute -top-32 h-[420px] w-[420px] animate-blob-drift rounded-full bg-brand-200/40 blur-[110px] start-[-6rem]" />

          <span className="absolute -top-16 h-[360px] w-[360px] animate-blob-drift rounded-full bg-gold-200/40 blur-[110px] end-[-5rem]" />

          <span className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-canvas" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 pb-20 sm:px-6 lg:px-8 lg:py-10">
          {isLoading ? (
            <ProfileSkeleton />
          ) : isError || !profile ? (
            <div className="py-10">
              <ErrorState
                title="تعذّر تحميل بياناتك"
                description="حدث خطأ أثناء تحميل الملف الشخصي. تحقّق من اتصالك وحاول مرة أخرى."
                onRetry={refetch}
              />
            </div>
          ) : (
            <div className="space-y-8">
              <ProfileHeader
                profile={profile}
                statistics={statistics}
                avatarVersion={avatarVersion}
                onEdit={() => setShowEdit(true)}
                onChangePassword={() => setShowChangePassword(true)}
                onChangePhoto={() => setShowAvatarUploader(true)}
              />

              <StatCards statistics={statistics} />

              <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
                <div className="space-y-8 lg:col-span-2">
                  <TypeBreakdown byType={byType} resolve={resolve} />

                  <MyListingsSection />
                </div>

                <aside className="space-y-6 lg:sticky lg:top-24">
                  <ProfileInfoCard profile={profile} />

                  <SecurityCard
                    onChangePassword={() => setShowChangePassword(true)}
                  />
                </aside>
              </div>
            </div>
          )}
        </div>
      </div>

      {showEdit && profile && (
        <EditProfileModal profile={profile} onClose={() => setShowEdit(false)} />
      )}

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}

      {showAvatarUploader && profile && (
        <AvatarUploader
          profile={profile}
          currentSrc={profile.profileImageUrl}
          onClose={() => setShowAvatarUploader(false)}
          // The API can hand back the same filename; bumping the version makes
          // the browser fetch the new bytes instead of the cached ones.
          onUploaded={() => setAvatarVersion((version) => version + 1)}
        />
      )}
    </>
  );
}
