import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { notificationService } from "@/services/notification.service";
import type { RecentActivity } from "@/types";

export interface Notification {
  id: number;
  userId: number;
  storeId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, any> | null;
}

type ToastVariant = "success" | "error" | "warning" | "info" | "default";

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  latestNotification: Notification | null;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
const NOTIFICATIONS_WS_URL = import.meta.env.VITE_NOTIFICATIONS_WS_URL;

function resolveSocketBaseUrl() {
  if (NOTIFICATIONS_WS_URL) {
    return NOTIFICATIONS_WS_URL;
  }

  try {
    const parsed = new URL(API_BASE_URL);
    parsed.pathname = "";
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch (error) {
    console.error(
      "Failed to parse API base URL for socket usage, falling back to http://localhost:8080",
      error
    );
    return "http://localhost:8080";
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [latestNotification, setLatestNotification] =
    useState<Notification | null>(null);
  
  const resolveToastVariant = (type: string): ToastVariant => {
    if (type === "appointment_cancelled") return "error";
    if (type === "appointment_created") return "success";
    if (type === "appointment_status_changed") return "info";
    if (type === "staff_invitation") return "info";
    if (type === "staff_invitation_accepted") return "success";
    return "default";
  };

  const showNotificationToast = (notification: Notification) => {
    const variant = resolveToastVariant(notification.type);
    const options = {
      description: notification.message,
    };

    switch (variant) {
      case "success":
        toast.success(notification.title, options);
        break;
      case "error":
        toast.error(notification.title, options);
        break;
      case "warning":
        toast.warning(notification.title, options);
        break;
      case "info":
        toast.info(notification.title, options);
        break;
      default:
        toast(notification.title, options);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!user || !token) {
      setNotifications([]);
      setLatestNotification(null);
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    let isMounted = true;

    notificationService
      .getUserNotifications()
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setNotifications(data);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch notifications", error);
      });

    const socketBaseUrl = resolveSocketBaseUrl();
    const newSocket = io(`${socketBaseUrl}/notifications`, {
      auth: {
        token: `Bearer ${token}`,
      },
    });

    newSocket.on("connect_error", (error) => {
      console.error("Notification socket connect_error", error);
    });

    newSocket.on("notification", (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setLatestNotification(notification);
      showNotificationToast(notification);

      if (
        [
          "appointment_created",
          "appointment_cancelled",
          "appointment_status_changed",
        ].includes(notification.type)
      ) {
        queryClient.invalidateQueries({
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            query.queryKey[0] === "appointments",
        });
        queryClient.invalidateQueries({
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            query.queryKey[0] === "dashboard-stats",
        });
      }
    });

    newSocket.on("activity", (activity: RecentActivity) => {
      queryClient.setQueryData<RecentActivity[]>(
        ["activities", activity.storeId],
        (prev) => {
          const existing = Array.isArray(prev) ? prev : [];
          return [activity, ...existing].slice(0, 50);
        }
      );
    });

    setSocket(newSocket);

    return () => {
      isMounted = false;
      newSocket.removeAllListeners();
      newSocket.disconnect();
    };
  }, [user, queryClient]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const markAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      console.error("Failed to mark notifications as read", error);
    }
  };

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      latestNotification,
      markAsRead,
      markAllAsRead,
    }),
    [notifications, unreadCount, latestNotification]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
