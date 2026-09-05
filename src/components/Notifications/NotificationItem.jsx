import { memo } from "react";
import {
  Bell,
  Heart,
  MessageSquare,
  Megaphone,
  Package,
  Search,
  ShoppingBag,
  Trash2,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useNotificationActions } from "./useNotifications";
import { formatRelativeTime, parseApiDate } from "../../utils/format";
import { resolveMediaUrl } from "../../utils/mediaUrl";

const RULES = [
  {
    match: /comment|reply|تعليق|رد/i,
    icon: MessageSquare,
    accent: "#0e7490",
    accentDark: "#259fc0",
    tint: "#e6f3f6",
  },
  {
    match: /like|favourite|favorite|إعجاب|أعجب/i,
    icon: Heart,
    accent: "#be123c",
    accentDark: "#f65f84",
    tint: "#fdeaee",
  },
  {
    match: /lost|found|مفقود|عثر/i,
    icon: Search,
    accent: "#7c3aed",
    accentDark: "#a779f6",
    tint: "#f1ebfe",
  },
  {
    match: /profile|account|user|حساب|الملف/i,
    icon: UserRound,
    accent: "#0f766e",
    accentDark: "#3da8a0",
    tint: "#e4f4f2",
  },
  {
    match: /order|payment|طلب|دفع/i,
    icon: ShoppingBag,
    accent: "#059669",
    accentDark: "#32b38b",
    tint: "#e7f6f0",
  },
  {
    match: /ad|advert|listing|product|إعلان/i,
    icon: Megaphone,
    accent: "#23426c",
    accentDark: "#6b93c9",
    tint: "#e9eef5",
  },
  {
    match: /./,
    icon: Package,
    accent: "#23426c",
    accentDark: "#6b93c9",
    tint: "#e9eef5",
  },
];

const FALLBACK = {
  icon: Bell,
  accent: "#b47a10",
  accentDark: "#b68b3c",
  tint: "#fcefc8",
};

function styleFor(notification) {
  const haystack = [
    notification?.icon,
    notification?.referenceType,
    notification?.entityName,
    notification?.title,
  ]
    .filter(Boolean)
    .join(" ");

  if (!haystack) return FALLBACK;

  return RULES.find((rule) => rule.match.test(haystack)) ?? FALLBACK;
}

function AdminGlyph({ notification }) {
  const image = resolveMediaUrl(notification.imageUrl);

  if (image) {
    return (
      <span className="mt-0.5 block h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-line bg-canvas">
        <img
          src={image}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  if (!notification.icon) return null;

  return (
    <span
      aria-hidden="true"
      className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[19px] leading-none transition-transform duration-300 ease-out group-hover:scale-105"
      style={{ backgroundColor: "var(--tint)" }}
    >
      {notification.icon}
    </span>
  );
}

function NotificationItem({ notification, to, onNavigate, variant = "user" }) {
  const navigate = useNavigate();

  const { markAsReadMutation, deleteNotificationMutation } =
    useNotificationActions();

  const { icon: Icon, accent, accentDark, tint } = styleFor(notification);

  const isUnread = !notification.isRead;

  // A row with nowhere to go still marks itself read — it just does not move
  // the page. Presented as a plain region rather than a button so it does not
  // promise a navigation it cannot deliver.
  const canOpen = Boolean(to);

  const handleClick = () => {
    if (isUnread) markAsReadMutation.mutate(notification.id);

    if (!canOpen) return;

    onNavigate?.();

    navigate(to);
  };

  const timestamp = parseApiDate(notification.createdAt);

  const adminGlyph =
    variant === "admin" ? <AdminGlyph notification={notification} /> : null;

  return (
    <div
      {...(canOpen || isUnread
        ? {
            role: "button",
            tabIndex: 0,
            onClick: handleClick,
            onKeyDown: (event) => {
              if (event.key !== "Enter" && event.key !== " ") return;

              event.preventDefault();

              handleClick();
            },
          }
        : {})}
      style={{
        "--accent-light": accent,
        "--accent-dark": accentDark ?? accent,
        "--tint-light": tint,
      }}
      className={`notification-row group relative flex gap-3.5 px-4 py-4 transition-[background-color,filter] duration-200 ${
        canOpen || isUnread ? "cursor-pointer" : ""
      } ${
        isUnread
          ? "bg-[color:var(--tint)] hover:brightness-[0.97]"
          : "hover:bg-canvas"
      }`}
    >
      {/* Unread rail — reads as "new" even in peripheral vision. */}
      {isUnread && (
        <span
          aria-hidden="true"
          className="absolute inset-y-2 w-[3px] rounded-full bg-[color:var(--accent)] start-0"
        />
      )}

      {adminGlyph ?? (
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[color:var(--accent)] transition-transform duration-300 ease-out group-hover:scale-105"
          style={{ backgroundColor: "var(--tint)" }}
        >
          <Icon size={19} strokeWidth={2} />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <h3
            className={`min-w-0 flex-1 text-[15px] leading-6 text-ink ${
              isUnread ? "font-bold" : "font-semibold"
            }`}
          >
            {notification.title}
          </h3>

          {isUnread && (
            <span
              aria-label="غير مقروء"
              className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[color:var(--accent)]"
            />
          )}
        </div>

        <p className="mt-1 line-clamp-2 text-[13px] leading-6 text-ink-soft">
          {notification.message}
        </p>

        {/* The exact instant lives in the tooltip and in `datetime`; the label
            stays relative, which is what people actually read. */}
        <time
          dateTime={timestamp?.toISOString()}
          title={timestamp?.toLocaleString("ar-EG")}
          className="tnum mt-2 block text-xs font-medium text-muted"
        >
          {formatRelativeTime(notification.createdAt)}
        </time>
      </div>

      <button
        type="button"
        aria-label="حذف الإشعار"
        onClick={(event) => {
          event.stopPropagation();

          deleteNotificationMutation.mutate(notification.id);
        }}
        disabled={deleteNotificationMutation.isPending}
        className="h-8 w-8 shrink-0 cursor-pointer self-start rounded-lg text-muted opacity-0 transition-[opacity,background-color,color] duration-200 hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 group-hover:opacity-100 disabled:opacity-40 max-sm:opacity-100"
      >
        <Trash2 size={16} className="mx-auto" />
      </button>
    </div>
  );
}

/* The drawer re-renders on every cache touch (a read, a delete, a poll); a row
   only changes when its own fields or its destination do. */
export default memo(
  NotificationItem,
  (previous, next) =>
    previous.to === next.to &&
    previous.variant === next.variant &&
    previous.notification.id === next.notification.id &&
    previous.notification.isRead === next.notification.isRead
);
