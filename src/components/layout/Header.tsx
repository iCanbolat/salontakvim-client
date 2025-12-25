/**
 * Header Component
 * Shows breadcrumbs, user menu, and mobile menu button
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Loader2, Menu } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/contexts/NotificationContext";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";
import { Breadcrumbs } from "./Breadcrumbs";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const navigate = useNavigate();
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const maxVisibleNotifications = 8;

  const visibleNotifications = useMemo(
    () => notifications.slice(0, maxVisibleNotifications),
    [notifications]
  );

  const handleNotificationClick = async (
    id: number,
    isRead: boolean,
    url?: string
  ) => {
    try {
      if (!isRead) {
        await markAsRead(id);
      }
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }

    if (url) {
      navigate(url);
    }
  };

  const handleMarkAll = async () => {
    if (!unreadCount) return;
    setIsMarkingAll(true);
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Mobile Menu Button + Breadcrumbs */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <Breadcrumbs />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 p-0">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Notifications
                  </p>
                  <p className="text-xs text-gray-500">
                    {unreadCount > 0
                      ? `${unreadCount} unread`
                      : "You're all caught up"}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs h-8 px-2"
                    disabled={isMarkingAll}
                    onClick={handleMarkAll}
                  >
                    {isMarkingAll ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCheck className="h-3.5 w-3.5" />
                    )}
                    Mark all as read
                  </Button>
                )}
              </div>
              {visibleNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
                  <div className="rounded-full bg-gray-100 p-3">
                    <Bell className="h-6 w-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      No notifications yet
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Appointment activity will appear here
                    </p>
                  </div>
                </div>
              ) : (
                <ScrollArea className="max-h-[400px]">
                  <div>
                    {visibleNotifications.map((notification) => (
                      <button
                        key={notification.id}
                        className={cn(
                          "flex w-full flex-col gap-2 px-4 py-3 text-left transition-colors hover:bg-gray-50 border-b last:border-b-0",
                          !notification.isRead && "bg-blue-50/50"
                        )}
                        onClick={() =>
                          handleNotificationClick(
                            notification.id,
                            notification.isRead,
                            notification.metadata?.url as string | undefined
                          )
                        }
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                                {notification.title}
                              </p>
                              {!notification.isRead && (
                                <span className="shrink-0 h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDistanceToNow(
                            new Date(notification.createdAt),
                            {
                              addSuffix: true,
                            }
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
