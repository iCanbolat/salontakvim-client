import { axiosInstance } from "./api-client";
import type {
  NotificationSettings,
  UpdateNotificationSettingsDto,
} from "@/types/notification.types";
import type { Notification } from "@/contexts/NotificationContext";

export const notificationService = {
  /**
   * Get notification settings for the store
   */
  async getNotificationSettings(
    storeId: string
  ): Promise<NotificationSettings> {
    const response = await axiosInstance.get<NotificationSettings>(
      `/stores/${storeId}/notifications/settings`
    );
    return response.data;
  },

  /**
   * Update notification settings
   */
  async updateNotificationSettings(
    storeId: string,
    data: UpdateNotificationSettingsDto
  ): Promise<NotificationSettings> {
    const response = await axiosInstance.patch<NotificationSettings>(
      `/stores/${storeId}/notifications/settings`,
      data
    );
    return response.data;
  },

  async getUserNotifications(): Promise<Notification[]> {
    const response = await axiosInstance.get<Notification[]>(`/notifications`);
    return response.data;
  },

  async markAsRead(id: string): Promise<void> {
    await axiosInstance.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await axiosInstance.patch(`/notifications/read-all`);
  },
};
