import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import { Switch } from "../../../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Separator } from "../../../components/ui/separator";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import {
  Bell,
  CheckCircle2,
  Loader2,
  Mail,
  Activity,
  Settings,
  XCircle,
  RefreshCw,
  Coffee,
  UserPlus,
  CheckCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNotificationSettings } from "./hooks/useNotificationSettings";
import { useSearchParams } from "react-router-dom";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../../components/ui/tabs";
import { useNotifications } from "../../../contexts/NotificationContext";
import { activityService } from "../../../services";
import { notificationService } from "../../../services/notification.service";
import { RecentActivityList } from "../../../components/common/RecentActivityList";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../../components/ui/button";
import { cn } from "../../../lib/utils";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { useAuth } from "../../../contexts";

export function NotificationSettings() {
  const { user } = useAuth();

  // Role checks
  const isManager = user?.role === "manager";
  const isStaff = user?.role === "staff";
  const isAdmin = user?.role === "admin";

  const { state, actions, data } = useNotificationSettings({
    enableSettings: isAdmin,
  });
  const { isLoading: settingsLoading } = state;
  const { settings, store } = data;
  const { handleUpdate } = actions;

  const [searchParams, setSearchParams] = useSearchParams();
  // Default tab: admin/owner to settings, others to notifications
  const defaultTab = isAdmin ? "settings" : "notifications";
  const activeTab = searchParams.get("tab") || defaultTab;

  // Redirect unauthorized access to appropriate tabs
  useEffect(() => {
    if ((isManager || isStaff) && activeTab === "settings") {
      setSearchParams({ tab: "notifications" });
      return;
    }
    if (isStaff && activeTab === "activities") {
      setSearchParams({ tab: "notifications" });
    }
  }, [isManager, isStaff, activeTab, setSearchParams]);

  const {
    unreadCount,
    markAsRead,
    markAllAsRead,
    latestNotification,
    latestActivity,
  } = useNotifications();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!latestNotification) return;

    // Invalidate notifications list when a new one arrives
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }, [latestNotification, queryClient]);

  // Real-time activity updates
  useEffect(() => {
    if (!latestActivity) return;

    if (activeTab === "activities") {
      queryClient.invalidateQueries({
        queryKey: ["activities", store?.id],
      });
    }
  }, [latestActivity, queryClient, activeTab, store?.id]);

  const [notificationStatus, setNotificationStatus] = useState<
    "all" | "read" | "unread"
  >("all");
  const [notificationPage, setNotificationPage] = useState(1);
  const [activityType, setActivityType] = useState("all");
  const [activityPage, setActivityPage] = useState(1);

  const notificationPageSize = 10;
  const activityPageSize = 10;

  const {
    data: notificationsPage,
    isLoading: notificationsLoading,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ["notifications", notificationPage, notificationStatus],
    queryFn: () =>
      notificationService.getUserNotificationsPaginated({
        page: notificationPage,
        limit: notificationPageSize,
        status: notificationStatus,
      }),
    enabled: activeTab === "notifications",
  });

  const { data: activitiesPage, isLoading: activitiesLoading } = useQuery({
    queryKey: ["activities", store?.id, activityPage, activityType],
    queryFn: () =>
      activityService.getActivitiesPaginated({
        storeId: store!.id,
        page: activityPage,
        limit: activityPageSize,
        type: activityType === "all" ? undefined : activityType,
        locationId: isManager ? user?.locationId || undefined : undefined,
      }),
    enabled: !!store?.id && activeTab === "activities" && !isStaff,
  });

  const handleTabChange = (value: string) => {
    if (value === "notifications") {
      setNotificationPage(1);
    }
    if (value === "activities") {
      setActivityPage(1);
    }
    setSearchParams({ tab: value });
  };

  const notificationsList = notificationsPage?.data ?? [];
  const notificationsTotalPages = notificationsPage?.totalPages ?? 1;

  const activitiesList = activitiesPage?.data ?? [];
  const activitiesTotalPages = activitiesPage?.totalPages ?? 1;

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
      default:
        return {
          icon: Bell,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
        };
    }
  };

  if (isAdmin && (settingsLoading || !settings)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Bildirim Merkezi</h2>
        <p className="text-muted-foreground">
          Bildirimlerinizi yönetin ve son aktiviteleri takip edin.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-6"
      >
        <TabsList className="bg-white border shadow-sm">
          {isAdmin && (
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span>Ayarlar</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span>Bildirimler</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          {!isStaff && (
            <TabsTrigger value="activities" className="gap-2">
              <Activity className="h-4 w-4" />
              <span>Aktiviteler</span>
            </TabsTrigger>
          )}
        </TabsList>

        {isAdmin && (
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <CardTitle>E-posta Ayarları</CardTitle>
                </div>
                <CardDescription>
                  E-posta bildirimleri için temel yapılandırma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Gönderen Adı</Label>
                  <input
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="İşletme Adınız"
                    value={settings?.senderName}
                    onChange={(e) => handleUpdate("senderName", e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Bu isim, e-postaların "Gönderen" alanında görünecektir
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                  <CardTitle>Bildirim Türleri</CardTitle>
                </div>
                <CardDescription>
                  Bildirimleri etkinleştirin/devre dışı bırakın ve gönderim
                  kanallarını seçin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Appointment Confirmation */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Randevu Onayı</Label>
                      <p className="text-sm text-muted-foreground">
                        Yeni bir randevu oluşturulduğunda gönderilir
                      </p>
                    </div>
                    <Switch
                      checked={
                        settings?.appointmentConfirmationEnabled ?? false
                      }
                      onCheckedChange={(checked) =>
                        handleUpdate("appointmentConfirmationEnabled", checked)
                      }
                    />
                  </div>
                  {settings?.appointmentConfirmationEnabled && (
                    <div className="ml-4 space-y-2">
                      <Label>Gönderim Kanalı</Label>
                      <Select
                        value={settings?.appointmentConfirmationChannel}
                        onValueChange={(value: any) =>
                          handleUpdate("appointmentConfirmationChannel", value)
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">E-posta</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="both">Her İkisi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Appointment Reminders */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">
                        Randevu Hatırlatıcıları
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Randevulardan önce otomatik hatırlatıcılar
                      </p>
                    </div>
                    <Switch
                      checked={settings?.appointmentReminderEnabled ?? false}
                      onCheckedChange={(checked) =>
                        handleUpdate("appointmentReminderEnabled", checked)
                      }
                    />
                  </div>
                  {settings?.appointmentReminderEnabled && (
                    <div className="ml-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-normal">
                          24 saat kala hatırlat
                        </Label>
                        <Switch
                          checked={settings?.reminder24hEnabled ?? false}
                          onCheckedChange={(checked) =>
                            handleUpdate("reminder24hEnabled", checked)
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-normal">
                          1 saat kala hatırlat
                        </Label>
                        <Switch
                          checked={settings?.reminder1hEnabled ?? false}
                          onCheckedChange={(checked) =>
                            handleUpdate("reminder1hEnabled", checked)
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Appointment Cancellation */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Randevu İptali</Label>
                      <p className="text-sm text-muted-foreground">
                        Bir randevu iptal edildiğinde gönderilir
                      </p>
                    </div>
                    <Switch
                      checked={
                        settings?.appointmentCancellationEnabled ?? false
                      }
                      onCheckedChange={(checked) =>
                        handleUpdate("appointmentCancellationEnabled", checked)
                      }
                    />
                  </div>
                  {settings?.appointmentCancellationEnabled && (
                    <div className="ml-4 space-y-2">
                      <Label>Gönderim Kanalı</Label>
                      <Select
                        value={settings?.appointmentCancellationChannel}
                        onValueChange={(value: any) =>
                          handleUpdate("appointmentCancellationChannel", value)
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">E-posta</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="both">Her İkisi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Appointment Rescheduled */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">
                        Randevu Saati Değişikliği
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Randevu saati değiştirildiğinde gönderilir
                      </p>
                    </div>
                    <Switch
                      checked={settings?.appointmentRescheduledEnabled ?? false}
                      onCheckedChange={(checked) =>
                        handleUpdate("appointmentRescheduledEnabled", checked)
                      }
                    />
                  </div>
                  {settings?.appointmentRescheduledEnabled && (
                    <div className="ml-4 space-y-2">
                      <Label>Gönderim Kanalı</Label>
                      <Select
                        value={settings?.appointmentRescheduledChannel}
                        onValueChange={(value: any) =>
                          handleUpdate("appointmentRescheduledChannel", value)
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">E-posta</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="both">Her İkisi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Customer Feedback Request */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">
                        Müşteri Geri Bildirim Talebi
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        E-posta her zaman gönderilir; SMS ile göndermek için de
                        etkinleştirin
                      </p>
                    </div>
                    <Switch
                      checked={settings?.feedbackRequestSmsEnabled ?? false}
                      onCheckedChange={(checked) =>
                        handleUpdate("feedbackRequestSmsEnabled", checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Bildirimler</CardTitle>
                <CardDescription>Size gelen tüm bildirimler</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={notificationStatus}
                  onValueChange={(value: "all" | "read" | "unread") => {
                    setNotificationStatus(value);
                    setNotificationPage(1);
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="unread">Okunmadı</SelectItem>
                    <SelectItem value="read">Okundu</SelectItem>
                  </SelectContent>
                </Select>

                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await markAllAsRead();
                      await refetchNotifications();
                    }}
                  >
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Tümünü okundu işaretle
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {notificationsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : notificationsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-gray-100 p-3 mb-4">
                    <Bell className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="font-medium text-gray-900">Bildirim yok</p>
                </div>
              ) : (
                <div className="divide-y overflow-auto max-h-[600px]">
                  {notificationsList.map((notification) => {
                    const config = getNotificationConfig(notification.type);
                    const Icon = config.icon;
                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "px-6 py-4 flex items-start gap-4 transition-colors",
                          !notification.isRead && "bg-blue-50/30",
                        )}
                      >
                        <div
                          className={cn(
                            "p-2 rounded-full shrink-0",
                            config.bgColor,
                          )}
                        >
                          <Icon className={cn("h-4 w-4", config.color)} />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-sm">
                              {notification.title}
                            </p>
                            <span className="text-xs text-muted-foreground text-right shrink-0">
                              {formatDistanceToNow(
                                new Date(notification.createdAt),
                                {
                                  addSuffix: true,
                                  locale: tr,
                                },
                              )}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {notification.message}
                          </p>
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 text-xs text-blue-600"
                              onClick={async () => {
                                await markAsRead(notification.id);
                                await refetchNotifications();
                              }}
                            >
                              Okundu işaretle
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <span className="text-xs text-muted-foreground">
                Sayfa {notificationPage} / {notificationsTotalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={notificationPage <= 1}
                  onClick={() =>
                    setNotificationPage((prev) => Math.max(1, prev - 1))
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={notificationPage >= notificationsTotalPages}
                  onClick={() =>
                    setNotificationPage((prev) =>
                      Math.min(notificationsTotalPages, prev + 1),
                    )
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {!isStaff && (
          <TabsContent value="activities" className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Durum</Label>
                <Select
                  value={activityType}
                  onValueChange={(value) => {
                    setActivityType(value);
                    setActivityPage(1);
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="appointment">Randevu</SelectItem>
                    <SelectItem value="customer">Müşteri</SelectItem>
                    <SelectItem value="staff">Personel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Sayfa {activityPage} / {activitiesTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={activityPage <= 1}
                  onClick={() =>
                    setActivityPage((prev) => Math.max(1, prev - 1))
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={activityPage >= activitiesTotalPages}
                  onClick={() =>
                    setActivityPage((prev) =>
                      Math.min(activitiesTotalPages, prev + 1),
                    )
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="min-h-[600px]">
              {activitiesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <RecentActivityList
                  activities={activitiesList}
                  showViewAll={false}
                />
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>

      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          Tüm değişiklikler otomatik olarak kaydedilir. Bildirimler bu ayarlara
          göre gönderilecektir.
        </AlertDescription>
      </Alert>
    </div>
  );
}
