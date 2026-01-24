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
import { Bell, CheckCircle2, Loader2, Mail } from "lucide-react";
import { useNotificationSettings } from "./hooks/useNotificationSettings";

export function NotificationSettings() {
  const { state, actions, data } = useNotificationSettings();
  const { isLoading } = state;
  const { settings } = data;
  const { handleUpdate } = actions;

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Notification Settings
        </h2>
        <p className="text-muted-foreground">
          Configure how your customers and staff receive notifications.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Email Settings</CardTitle>
          </div>
          <CardDescription>
            Basic configuration for email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Sender Name</Label>
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Your Business Name"
              value={settings.senderName}
              onChange={(e) => handleUpdate("senderName", e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              This name will appear in the "From" field of emails
            </p>
          </div>
        </CardContent>
      </Card>

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
                  onValueChange={(value: any) =>
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
                    onValueChange={(value: any) =>
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
                  onValueChange={(value: any) =>
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
                  onValueChange={(value: any) =>
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

          {/* Customer Feedback Request */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Customer Feedback Request</Label>
                <p className="text-sm text-muted-foreground">
                  Email is always sent; enable to also send via SMS
                </p>
              </div>
              <Switch
                checked={settings.feedbackRequestSmsEnabled}
                onCheckedChange={(checked) =>
                  handleUpdate("feedbackRequestSmsEnabled", checked)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
