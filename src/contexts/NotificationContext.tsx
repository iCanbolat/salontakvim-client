import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bell,
  Calendar,
  XCircle,
  RefreshCw,
  Coffee,
  UserPlus,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { notificationService } from "@/services/notification.service";
import { authService } from "@/services";
import type { RecentActivity } from "@/types";
import { cn } from "@/lib/utils";

export interface Notification {
  id: string;
  userId: string;
  storeId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, any> | null;
}

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  latestNotification: Notification | null;
  latestActivity: RecentActivity | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined,
);

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
const NOTIFICATIONS_WS_URL = import.meta.env.VITE_NOTIFICATIONS_WS_URL;
const CLIENT_URL = import.meta.env.VITE_CLIENT_URL || "http://localhost:3000";

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
      error,
    );
    return "http://localhost:8080";
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const refreshInFlightRef = useRef(false);
  const [latestNotification, setLatestNotification] =
    useState<Notification | null>(null);
  const [latestActivity, setLatestActivity] = useState<RecentActivity | null>(
    null,
  );

  const getNotificationConfig = (type: string) => {
    switch (type) {
      case "appointment_created":
        return {
          icon: Calendar,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
        };
      case "appointment_cancelled":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-50",
        };
      case "appointment_status_changed":
        return {
          icon: RefreshCw,
          color: "text-amber-600",
          bgColor: "bg-amber-50",
        };
      case "staff_time_off":
        return {
          icon: Coffee,
          color: "text-purple-600",
          bgColor: "bg-purple-50",
        };
      case "staff_invitation":
        return {
          icon: UserPlus,
          color: "text-green-600",
          bgColor: "bg-green-50",
        };
      case "staff_break_approved":
        return {
          icon: CheckCircle2,
          color: "text-green-600",
          bgColor: "bg-green-50",
        };
      case "staff_break_declined":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-50",
        };
      case "appointment_file_uploaded":
        return {
          icon: FileText,
          color: "text-indigo-600",
          bgColor: "bg-indigo-50",
        };
      default:
        return {
          icon: Bell,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
        };
    }
  };

  const isBrowserNotificationSupported = () =>
    typeof window !== "undefined" && "Notification" in window;

  const maybeShowBrowserNotification = (notification: Notification) => {
    if (!isBrowserNotificationSupported()) return;

    const isVisible =
      typeof document !== "undefined" && document.visibilityState === "visible";
    const hasFocus =
      typeof document !== "undefined" && typeof document.hasFocus === "function"
        ? document.hasFocus()
        : false;

    // Avoid duplicate system notifications when the app is already in view.
    if (isVisible && hasFocus) return;

    const show = () => {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: "/vite.svg", // Using vite.svg as requested
      });

      browserNotification.onclick = () => {
        window.focus();
        // Redirect to appointments page using CLIENT_URL
        window.location.href = `${CLIENT_URL}/appointments`;
        browserNotification.close();
      };
    };

    if (Notification.permission === "granted") {
      show();
      return;
    }

    if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          show();
        }
      });
    }
  };

  const showNotificationToast = (notification: Notification) => {
    const config = getNotificationConfig(notification.type);
    const Icon = config.icon;
    const url = notification.metadata?.url as string | undefined;

    toast.custom(
      (toastInstance: any) => (
        <div
          className={cn(
            "pointer-events-auto w-[360px] rounded-lg border border-gray-200 bg-white p-4 shadow-lg",
            toastInstance.visible
              ? "animate-in fade-in zoom-in"
              : "animate-out fade-out zoom-out",
            url ? "cursor-pointer" : "cursor-default",
          )}
          role="status"
          onClick={() => {
            if (url) {
              window.location.href = url;
            }
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn("shrink-0 p-2 rounded-full mt-0.5", config.bgColor)}
            >
              <Icon className={cn("h-4 w-4", config.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                  {notification.title}
                </p>
                <button
                  className="text-xs text-gray-400 hover:text-gray-600"
                  onClick={(event) => {
                    event.stopPropagation();
                    toast.dismiss(toastInstance.id);
                  }}
                >
                  Dismiss
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {notification.message}
              </p>
              {url && (
                <p className="text-[11px] text-gray-400 mt-2">
                  Detaylari goruntulemek icin tiklayin
                </p>
              )}
            </div>
          </div>
        </div>
      ),
      {
        duration: 6000,
      },
    );

    // Browser notification (fallback to request permission if needed)
    maybeShowBrowserNotification(notification);
  };

  useEffect(() => {
    // Request browser notification permission
    if (
      isBrowserNotificationSupported() &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }

    const token = localStorage.getItem("accessToken");

    if (!user || !token) {
      setNotifications([]);
      setLatestNotification(null);
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        setSocket(null);
      }
      socketRef.current = null;
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
    socketRef.current = newSocket;

    const tryRefreshAndReconnect = async () => {
      if (refreshInFlightRef.current) {
        return;
      }

      refreshInFlightRef.current = true;
      try {
        const storedRefreshToken = localStorage.getItem("refreshToken");
        if (!storedRefreshToken) {
          return;
        }

        const refreshed = await authService.refreshToken(storedRefreshToken);
        const newAccessToken = refreshed.accessToken;

        if (socketRef.current && newAccessToken) {
          socketRef.current.auth = { token: `Bearer ${newAccessToken}` };
          socketRef.current.connect();
        }
      } catch (error) {
        console.error("Failed to refresh token for notifications", error);
      } finally {
        refreshInFlightRef.current = false;
      }
    };

    newSocket.on("connect_error", (error) => {
      console.error("Notification socket connect_error", error);
      const message =
        typeof (error as { message?: string })?.message === "string"
          ? (error as { message?: string }).message
          : "";

      const normalized = (message ?? "").toLowerCase();
      if (normalized.includes("jwt") || normalized.includes("unauthorized")) {
        void tryRefreshAndReconnect();
      }
    });

    newSocket.on("connect", () => {
      notificationService
        .getUserNotifications()
        .then((data) => {
          if (Array.isArray(data)) {
            setNotifications(data);
          }
        })
        .catch((error) => {
          console.error("Failed to refresh notifications", error);
        });
    });

    newSocket.on("notification", (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setLatestNotification(notification);
      showNotificationToast(notification);
    });

    newSocket.on("activity", (activity: RecentActivity) => {
      setLatestActivity(activity);
      // Invalidate all activity-related queries so they refetch
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["admin-activities"] });
    });

    setSocket(newSocket);

    return () => {
      isMounted = false;
      newSocket.removeAllListeners();
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [user, queryClient]);

  useEffect(() => {
    const handleTokenRefreshed = (event: Event) => {
      const customEvent = event as CustomEvent<{ accessToken?: string }>;
      const newAccessToken =
        customEvent.detail?.accessToken || localStorage.getItem("accessToken");

      if (!socketRef.current || !newAccessToken) {
        return;
      }

      socketRef.current.auth = { token: `Bearer ${newAccessToken}` };
      socketRef.current.connect();
    };

    window.addEventListener("auth:token-refreshed", handleTokenRefreshed);
    return () => {
      window.removeEventListener("auth:token-refreshed", handleTokenRefreshed);
    };
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true })),
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
      latestActivity,
      markAsRead,
      markAllAsRead,
    }),
    [notifications, unreadCount, latestNotification, latestActivity],
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
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}
