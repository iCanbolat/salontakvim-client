import { axiosInstance } from "./api-client";
import type {
  NotificationSettings,
  UpdateNotificationSettingsDto,
} from "@/types/notification.types";

export const notificationService = {
  /**
   * Get notification settings for the store
   */
  async getNotificationSettings(
    storeId: number
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
    storeId: number,
    data: UpdateNotificationSettingsDto
  ): Promise<NotificationSettings> {
    const response = await axiosInstance.patch<NotificationSettings>(
      `/stores/${storeId}/notifications/settings`,
      data
    );
    return response.data;
  },
};
