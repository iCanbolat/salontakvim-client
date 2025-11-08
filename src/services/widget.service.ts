import { axiosInstance } from "./api-client";
import type {
  WidgetSettings,
  UpdateWidgetSettingsDto,
  WidgetEmbedCode,
} from "@/types/widget.types";

export const widgetService = {
  /**
   * Get widget settings for the store
   */
  async getWidgetSettings(storeId: number): Promise<WidgetSettings> {
    const response = await axiosInstance.get<WidgetSettings>(
      `/stores/${storeId}/widget-settings`
    );
    return response.data;
  },

  /**
   * Update widget settings
   */
  async updateWidgetSettings(
    storeId: number,
    data: UpdateWidgetSettingsDto
  ): Promise<WidgetSettings> {
    const response = await axiosInstance.patch<WidgetSettings>(
      `/stores/${storeId}/widget-settings`,
      data
    );
    return response.data;
  },

  /**
   * Regenerate widget key (WARNING: This will invalidate the old widget key)
   */
  async regenerateWidgetKey(storeId: number): Promise<{ widgetKey: string }> {
    const response = await axiosInstance.post<{ widgetKey: string }>(
      `/stores/${storeId}/widget-settings/regenerate-key`
    );
    return response.data;
  },

  /**
   * Get widget embed code
   */
  async getEmbedCode(storeId: number): Promise<WidgetEmbedCode> {
    const response = await axiosInstance.get<WidgetEmbedCode>(
      `/stores/${storeId}/widget-settings/embed-code`
    );
    return response.data;
  },
};
