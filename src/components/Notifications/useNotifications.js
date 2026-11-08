import { useContext } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { getNotifications } from "../../api/notifications/getNotifications";
import { getUnreadCount } from "../../api/notifications/getUnreadCount";
import { markAsRead } from "../../api/notifications/markAsRead";
import { markAllAsRead } from "../../api/notifications/markAllAsRead";
import { deleteNotification } from "../../api/notifications/deleteNotification";
import { deleteAllNotifications } from "../../api/notifications/deleteAllNotifications";
import {
  deleteAdminNotification,
  getAdminNotifications,
  getAdminUnreadCount,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
} from "../../api/admin/notifications/adminNotificationsEndpoints";
import { AuthContext } from "../../context/AuthContext";
import { apiError, apiMessage } from "../../pages/Profile/profileCache";
import {
  countAfterReadingAll,
  countAfterReadingOne,
  markAllReadInList,
  markOneReadInList,
  wasUnreadInLists,
} from "./notificationState";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"];

export const UNREAD_COUNT_QUERY_KEY = ["notifications-unread-count"];

export const ADMIN_NOTIFICATIONS_QUERY_KEY = ["admin-notifications"];

export const ADMIN_UNREAD_COUNT_QUERY_KEY = ["admin-notifications-unread-count"];

const USER_API = {
  listKey: NOTIFICATIONS_QUERY_KEY,
  countKey: UNREAD_COUNT_QUERY_KEY,
  list: getNotifications,
  count: getUnreadCount,
  markRead: markAsRead,
  markAllRead: markAllAsRead,
  remove: deleteNotification,
  /* Only the user API publishes a delete-all; the admin one does not, and the
     drawer hides the control rather than clearing the wrong inbox. */
  removeAll: deleteAllNotifications,
};

const ADMIN_API = {
  listKey: ADMIN_NOTIFICATIONS_QUERY_KEY,
  countKey: ADMIN_UNREAD_COUNT_QUERY_KEY,
  list: getAdminNotifications,
  count: getAdminUnreadCount,
  markRead: markAdminNotificationAsRead,
  markAllRead: markAllAdminNotificationsAsRead,
  remove: deleteAdminNotification,
  removeAll: null,
};

/** Which inbox this session reads. Exported so the drawer can adapt its UI. */
export function useNotificationsApi() {
  const { isAdmin } = useContext(AuthContext);

  return isAdmin ? ADMIN_API : USER_API;
}

/** Mutations only. Safe to call from a list row. */
export function useNotificationActions() {
  const queryClient = useQueryClient();

  const api = useNotificationsApi();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: api.listKey });
    queryClient.invalidateQueries({ queryKey: api.countKey });
  };

  const markAsReadMutation = useMutation({
    mutationFn: api.markRead,

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: api.listKey });
      await queryClient.cancelQueries({ queryKey: api.countKey });

      const previous = queryClient.getQueriesData({
        queryKey: api.listKey,
      });

      const previousCount = queryClient.getQueryData(api.countKey);

      /* The badge only moves if this row was unread in what the user sees, so
         a repeated click cannot take it down twice. */
      const wasUnread = wasUnreadInLists(previous, id);

      queryClient.setQueriesData({ queryKey: api.listKey }, (response) =>
        markOneReadInList(response, id)
      );

      queryClient.setQueryData(api.countKey, (response) =>
        countAfterReadingOne(response, wasUnread)
      );

      return { previous, previousCount };
    },

    onError: (error, _id, context) => {
      context?.previous?.forEach(([key, value]) =>
        queryClient.setQueryData(key, value)
      );

      if (context && "previousCount" in context) {
        queryClient.setQueryData(api.countKey, context.previousCount);
      }

      toast.error(apiError(error, "تعذّر تحديث الإشعار"));
    },

    /* No success toast: marking as read is a side effect of opening the
       notification, and a toast on top of a page transition is noise. */
    onSettled: refresh,
  });

  /* Optimistic like a single read: the rows and the badge agree the moment the
     button is pressed, are put back if the server refuses, and are re-read from
     the server either way. */
  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.markAllRead(),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: api.listKey });
      await queryClient.cancelQueries({ queryKey: api.countKey });

      const previous = queryClient.getQueriesData({ queryKey: api.listKey });

      const previousCount = queryClient.getQueryData(api.countKey);

      queryClient.setQueriesData({ queryKey: api.listKey }, markAllReadInList);

      queryClient.setQueryData(api.countKey, countAfterReadingAll);

      return { previous, previousCount };
    },

    onSuccess: (response) => {
      toast.success(apiMessage(response, "تم تحديد كل الإشعارات كمقروءة"));
    },

    onError: (error, _variables, context) => {
      context?.previous?.forEach(([key, value]) =>
        queryClient.setQueryData(key, value)
      );

      if (context && "previousCount" in context) {
        queryClient.setQueryData(api.countKey, context.previousCount);
      }

      toast.error(apiError(error, "تعذّر تحديث الإشعارات"));
    },

    onSettled: refresh,
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: api.remove,

    onSuccess: (response) => {
      toast.success(apiMessage(response, "تم حذف الإشعار"));

      refresh();
    },

    onError: (error) => {
      toast.error(apiError(error, "تعذّر حذف الإشعار"));
    },
  });

  const deleteAllNotificationsMutation = useMutation({
    /* Never silently falls back to the user endpoint: an inbox with no
       delete-all simply has no delete-all, and the control is hidden. */
    mutationFn: api.removeAll ?? (() => Promise.reject(new Error("unsupported"))),

    onSuccess: (response) => {
      toast.success(apiMessage(response, "تم حذف كل الإشعارات"));

      refresh();
    },

    onError: (error) => {
      toast.error(apiError(error, "تعذّر حذف الإشعارات"));
    },
  });

  return {
    markAsReadMutation,
    markAllAsReadMutation,
    deleteNotificationMutation,
    deleteAllNotificationsMutation,
  };
}

/** The unread badge on the navbar bell — cheap enough to keep everywhere. */
export function useUnreadCount() {
  const api = useNotificationsApi();

  return useQuery({
    queryKey: api.countKey,
    queryFn: api.count,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });
}

export default function useNotifications({
  unreadOnly = false,
  pageIndex = 1,
  pageSize = 10,
  enabled = true,
} = {}) {
  const api = useNotificationsApi();

  const notificationsQuery = useQuery({
    queryKey: [...api.listKey, unreadOnly, pageIndex, pageSize],
    queryFn: () => api.list({ unreadOnly, pageIndex, pageSize }),
    enabled,
    staleTime: 1000 * 30,
  });

  const unreadCountQuery = useUnreadCount();

  return {
    notificationsQuery,
    unreadCountQuery,
    ...useNotificationActions(),
  };
}
