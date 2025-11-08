import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storeService } from "@/services/store.service";
import { notificationService } from "@/services/notification.service";
import type {
  UpdateNotificationSettingsDto,
  NotificationChannel,
} from "@/types/notification.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  Mail,
  MessageSquare,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export default function NotificationSettings() {
  const queryClient = useQueryClient();

  // Get current store
  const { data: store } = useQuery({
    queryKey: ["store"],
    queryFn: storeService.getMyStore,
  });

  // Get notification settings
  const {
    data: settings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["notificationSettings", store?.id],
    queryFn: () => notificationService.getNotificationSettings(store!.id),
    enabled: !!store?.id,
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateNotificationSettingsDto) =>
      notificationService.updateNotificationSettings(store!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notificationSettings", store?.id],
      });
      toast.success("Notification settings updated successfully");
    },
    onError: () => {
      toast.error("Failed to update notification settings");
    },
  });

  const handleUpdate = (
    field: keyof UpdateNotificationSettingsDto,
    value: unknown
  ) => {
    updateMutation.mutate({ [field]: value } as UpdateNotificationSettingsDto);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load notification settings
        </AlertDescription>
      </Alert>
    );
  }

  if (!settings || !store) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Notification Settings
        </h1>
        <p className="text-muted-foreground">
          Configure email and SMS notifications for appointments and staff
        </p>
      </div>

      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Email Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure email sender information and provider
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Sender Name</Label>
              <Input
                value={settings.senderName}
                onChange={(e) => handleUpdate("senderName", e.target.value)}
                placeholder="Your Store Name"
              />
              <p className="text-sm text-muted-foreground">
                Name that appears in "From" field
              </p>
            </div>

            <div className="space-y-2">
              <Label>Sender Email</Label>
              <Input
                type="email"
                value={settings.senderEmail}
                onChange={(e) => handleUpdate("senderEmail", e.target.value)}
                placeholder="noreply@yourstore.com"
              />
              <p className="text-sm text-muted-foreground">
                Email address for outgoing notifications
              </p>
            </div>

            <div className="space-y-2">
              <Label>Reply-To Email (Optional)</Label>
              <Input
                type="email"
                value={settings.replyToEmail || ""}
                onChange={(e) => handleUpdate("replyToEmail", e.target.value)}
                placeholder="support@yourstore.com"
              />
              <p className="text-sm text-muted-foreground">
                Email for customer replies
              </p>
            </div>

            <div className="space-y-2">
              <Label>Email Provider</Label>
              <Select
                value={settings.emailProvider}
                onValueChange={(value) => handleUpdate("emailProvider", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="smtp">SMTP</SelectItem>
                  <SelectItem value="sendgrid">SendGrid</SelectItem>
                  <SelectItem value="aws-ses">AWS SES</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Email delivery service
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <CardTitle>SMS Configuration</CardTitle>
          </div>
          <CardDescription>Configure SMS provider (optional)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>SMS Provider (Optional)</Label>
            <Select
              value={settings.smsProvider || "none"}
              onValueChange={(value) =>
                handleUpdate("smsProvider", value === "none" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="twilio">Twilio</SelectItem>
                <SelectItem value="aws-sns">AWS SNS</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              SMS delivery service (requires provider credentials in backend)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notification Types</CardTitle>
          </div>
          <CardDescription>
            Enable/disable notifications and choose delivery channels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Appointment Confirmation */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Appointment Confirmation</Label>
                <p className="text-sm text-muted-foreground">
                  Sent when a new appointment is created
                </p>
              </div>
              <Switch
                checked={settings.appointmentConfirmationEnabled}
                onCheckedChange={(checked) =>
                  handleUpdate("appointmentConfirmationEnabled", checked)
                }
              />
            </div>
            {settings.appointmentConfirmationEnabled && (
              <div className="ml-4 space-y-2">
                <Label>Delivery Channel</Label>
                <Select
                  value={settings.appointmentConfirmationChannel}
                  onValueChange={(value: NotificationChannel) =>
                    handleUpdate("appointmentConfirmationChannel", value)
                  }
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
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
                <Label className="text-base">Appointment Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Automatic reminders before appointments
                </p>
              </div>
              <Switch
                checked={settings.appointmentReminderEnabled}
                onCheckedChange={(checked) =>
                  handleUpdate("appointmentReminderEnabled", checked)
                }
              />
            </div>
            {settings.appointmentReminderEnabled && (
              <div className="ml-4 space-y-4">
                <div className="space-y-2">
                  <Label>Delivery Channel</Label>
                  <Select
                    value={settings.appointmentReminderChannel}
                    onValueChange={(value: NotificationChannel) =>
                      handleUpdate("appointmentReminderChannel", value)
                    }
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>24 Hours Before</Label>
                  <Switch
                    checked={settings.reminder24hEnabled}
                    onCheckedChange={(checked) =>
                      handleUpdate("reminder24hEnabled", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>1 Hour Before</Label>
                  <Switch
                    checked={settings.reminder1hEnabled}
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
                <Label className="text-base">Appointment Cancellation</Label>
                <p className="text-sm text-muted-foreground">
                  Sent when an appointment is cancelled
                </p>
              </div>
              <Switch
                checked={settings.appointmentCancellationEnabled}
                onCheckedChange={(checked) =>
                  handleUpdate("appointmentCancellationEnabled", checked)
                }
              />
            </div>
            {settings.appointmentCancellationEnabled && (
              <div className="ml-4 space-y-2">
                <Label>Delivery Channel</Label>
                <Select
                  value={settings.appointmentCancellationChannel}
                  onValueChange={(value: NotificationChannel) =>
                    handleUpdate("appointmentCancellationChannel", value)
                  }
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
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
                <Label className="text-base">Appointment Rescheduled</Label>
                <p className="text-sm text-muted-foreground">
                  Sent when an appointment time is changed
                </p>
              </div>
              <Switch
                checked={settings.appointmentRescheduledEnabled}
                onCheckedChange={(checked) =>
                  handleUpdate("appointmentRescheduledEnabled", checked)
                }
              />
            </div>
            {settings.appointmentRescheduledEnabled && (
              <div className="ml-4 space-y-2">
                <Label>Delivery Channel</Label>
                <Select
                  value={settings.appointmentRescheduledChannel}
                  onValueChange={(value: NotificationChannel) =>
                    handleUpdate("appointmentRescheduledChannel", value)
                  }
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Separator />

          {/* Staff Invitation */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Staff Invitation</Label>
                <p className="text-sm text-muted-foreground">
                  Sent when inviting new staff members (Email only)
                </p>
              </div>
              <Switch
                checked={settings.staffInvitationEnabled}
                onCheckedChange={(checked) =>
                  handleUpdate("staffInvitationEnabled", checked)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Info */}
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          All changes are saved automatically. Notifications will be sent
          according to these settings.
        </AlertDescription>
      </Alert>
    </div>
  );
}
