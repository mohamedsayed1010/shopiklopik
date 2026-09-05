import { useState } from "react";
import { Bell } from "lucide-react";

import { useUnreadCount } from "./useNotifications";
import useNotificationsRealtime from "./useNotificationsRealtime";
import NotificationsDrawer from "./NotificationsDrawer";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);

  // Only the badge count. The list itself is the drawer's business, and the
  // bell is mounted on every page.
  const unreadCountQuery = useUnreadCount();

  /* The bell is the one notification component that is mounted on every page
     while signed in, which makes it the right place to hold the hub connection:
     one socket for the session, not one per drawer opening. */
  useNotificationsRealtime();

  const unreadCount = unreadCountQuery.data?.data || 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={
          unreadCount > 0
            ? `الإشعارات، ${unreadCount} غير مقروء`
            : "الإشعارات"
        }
        className="group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/15 text-white transition-[background-color,transform] duration-200 hover:bg-white/10 active:scale-95"
      >
        <Bell
          size={19}
          strokeWidth={1.9}
          className="transition-transform duration-300 group-hover:-rotate-12"
        />

        {unreadCount > 0 && (
          <>
            {/* Halo behind the count — reads as "live" without animating the
                number itself, which would be hard to read. */}
            <span
              aria-hidden="true"
              className="absolute -top-1 h-5 w-5 animate-ping rounded-full bg-red-500/60 end-0 -me-1"
            />

            <span className="tnum absolute -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white ring-2 ring-brand-900 end-0 -me-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          </>
        )}
      </button>

      <NotificationsDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
