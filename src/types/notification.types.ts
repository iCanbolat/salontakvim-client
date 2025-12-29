export type NotificationChannel = "email" | "sms" | "both";

export interface NotificationSettings {
  id: string;
  storeId: string;
  appointmentConfirmationEnabled: boolean;
  appointmentConfirmationChannel: NotificationChannel;
  appointmentReminderEnabled: boolean;
  appointmentReminderChannel: NotificationChannel;
  reminder24hEnabled: boolean;
  reminder1hEnabled: boolean;
  appointmentCancellationEnabled: boolean;
  appointmentCancellationChannel: NotificationChannel;
  appointmentRescheduledEnabled: boolean;
  appointmentRescheduledChannel: NotificationChannel;
  staffInvitationEnabled: boolean;
  senderEmail: string;
  senderName: string;
  replyToEmail?: string;
  emailProvider: string;
  smsProvider?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateNotificationSettingsDto {
  appointmentConfirmationEnabled?: boolean;
  appointmentConfirmationChannel?: NotificationChannel;
  appointmentReminderEnabled?: boolean;
  appointmentReminderChannel?: NotificationChannel;
  reminder24hEnabled?: boolean;
  reminder1hEnabled?: boolean;
  appointmentCancellationEnabled?: boolean;
  appointmentCancellationChannel?: NotificationChannel;
  appointmentRescheduledEnabled?: boolean;
  appointmentRescheduledChannel?: NotificationChannel;
  staffInvitationEnabled?: boolean;
  senderEmail?: string;
  senderName?: string;
  replyToEmail?: string;
  emailProvider?: string;
  smsProvider?: string;
}
