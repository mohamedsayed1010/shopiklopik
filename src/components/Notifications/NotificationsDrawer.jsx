import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BellOff, CheckCheck, ChevronLeft, Settings, Trash2 } from "lucide-react";

import useNotifications, { useNotificationsApi } from "./useNotifications";
import useNotificationTargets from "./useNotificationTargets";
import NotificationItem from "./NotificationItem";
import { isAwaitingReview } from "../../api/notifications/notificationTypes";
import ConfirmDialog from "../ui/ConfirmDialog";
import Drawer from "../ui/Drawer";
import EmptyState from "../ui/EmptyState";
import ErrorState from "../ui/ErrorState";
import Skeleton from "../ui/Skeleton";
import { ageInMs } from "../../utils/format";

/** The moderation queue this app already serves — see `Routes/index.jsx`. */
const ADMIN_ADS_ROUTE = "/admin/ads";

const GROUPS = [
  { key: "today", label: "اليوم", maxAgeMs: 24 * 60 * 60 * 1000 },
  { key: "week", label: "هذا الأسبوع", maxAgeMs: 7 * 24 * 60 * 60 * 1000 },
  { key: "older", label: "أقدم", maxAgeMs: Infinity },
];

function groupByRecency(notifications) {
  const buckets = new Map(GROUPS.map((group) => [group.key, []]));

  notifications.forEach((notification) => {
    // `ageInMs` pins zone-less server timestamps to UTC; reading them as local
    // time used to drop everything from the last few hours into "أقدم".
    const age = ageInMs(notification.createdAt) ?? Infinity;

    const group =
      GROUPS.find((candidate) => age < candidate.maxAgeMs) ?? GROUPS.at(-1);

    buckets.get(group.key).push(notification);
  });

  return GROUPS.map((group) => ({ ...group, items: buckets.get(group.key) })).filter(
    (group) => group.items.length > 0
  );
}

export default function NotificationsDrawer({ isOpen, onClose }) {
  const [isClearing, setIsClearing] = useState(false);

  // Nothing is fetched until the drawer is actually opened — the bell only
  // needs the unread count, which is its own (much cheaper) query.
  const api = useNotificationsApi();

  const {
    notificationsQuery,
    markAllAsReadMutation,
    deleteAllNotificationsMutation,
  } = useNotifications({
    enabled: isOpen,
  });

  const notifications = useMemo(
    () => notificationsQuery.data?.data?.items ?? [],
    [notificationsQuery.data]
  );

  const isAdminInbox = api.removeAll === null;

  const { targetFor: targetForUser } = useNotificationTargets(notifications);

  const targetFor = isAdminInbox
    ? (notification) => {
        if (isAwaitingReview(notification)) return ADMIN_ADS_ROUTE;

        return targetForUser(notification) ?? notification.deepLink ?? null;
      }
    : targetForUser;

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const groups = useMemo(() => groupByRecency(notifications), [notifications]);

  return (
    <Drawer open={isOpen} onClose={onClose} side="end" title="الإشعارات">
      {notifications.length > 0 && (
        <div className="flex items-center justify-between gap-3 border-b border-line bg-canvas px-4 py-3">
          <span className="tnum text-xs font-semibold text-ink-soft">
            {unreadCount > 0 ? `${unreadCount} غير مقروء` : "لا جديد"}
          </span>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-brand-600 transition-[background-color,color] duration-200 hover:bg-brand-50 hover:text-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCheck size={15} />
                تحديد الكل كمقروء
              </button>
            )}

            {api.removeAll && (
            <button
              type="button"
              onClick={() => setIsClearing(true)}
              disabled={deleteAllNotificationsMutation.isPending}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-muted transition-[background-color,color] duration-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={15} />
              حذف الكل
            </button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {notificationsQuery.isLoading ? (
          <div className="divide-y divide-line">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex gap-3.5 px-4 py-4">
                <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />

                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="mt-2 h-3 w-full" />
                  <Skeleton className="mt-2 h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notificationsQuery.isError ? (
          <ErrorState
            title="تعذّر تحميل الإشعارات"
            description="تحقّق من اتصالك بالإنترنت وحاول مرة أخرى."
            onRetry={notificationsQuery.refetch}
            className="m-4"
          />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title="لا توجد إشعارات بعد"
            description="ستظهر هنا التنبيهات الخاصة بإعلاناتك ورسائل المشترين."
            className="m-4 border-0 bg-transparent py-10"
          />
        ) : (
          groups.map((group) => (
            <section key={group.key}>
              <h3 className="sticky top-0 z-10 border-b border-line bg-surface/90 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-muted backdrop-blur-sm">
                {group.label}
              </h3>

              <ul className="divide-y divide-line">
                {group.items.map((notification) => (
                  <li key={notification.id}>
                    <NotificationItem
                      notification={notification}
                      to={targetFor(notification)}
                      variant={isAdminInbox ? "admin" : "user"}
                      /* Following a notification should leave the drawer
                         behind, not stack a route change under an open sheet. */
                      onNavigate={onClose}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      {/* Sits below the list rather than in the toolbar, which only appears
          once there is something to act on — the settings are most useful
          precisely when the drawer is still empty. */}
      <Link
        to="/notifications/settings"
        onClick={onClose}
        className="flex items-center gap-2.5 border-t border-line bg-canvas px-4 py-3.5 text-[13.5px] font-semibold text-ink-soft transition-colors duration-200 safe-bottom hover:bg-brand-50 hover:text-brand-900"
      >
        <Settings size={16} className="shrink-0 text-brand-400" />

        <span className="flex-1">إعدادات الإشعارات</span>

        <ChevronLeft size={16} className="shrink-0 text-muted" />
      </Link>

      <ConfirmDialog
        open={isClearing}
        title="حذف كل الإشعارات؟"
        description="سيتم حذف جميع الإشعارات نهائيًا ولا يمكن التراجع عن ذلك."
        confirmLabel="حذف الكل"
        loading={deleteAllNotificationsMutation.isPending}
        onConfirm={() =>
          deleteAllNotificationsMutation.mutate(undefined, {
            onSuccess: () => setIsClearing(false),
          })
        }
        onClose={() => setIsClearing(false)}
      />
    </Drawer>
  );
}
