import { axiosInstance } from "./api-client";
import type {
  WidgetSettings,
  UpdateWidgetSettingsDto,
  WidgetEmbedCode,
  WidgetSecurityStatus,
} from "@/types/widget.types";

export const widgetService = {
  /**
   * Get widget settings for the store
   */
  async getWidgetSettings(storeId: string): Promise<WidgetSettings> {
    const response = await axiosInstance.get<WidgetSettings>(
      `/stores/${storeId}/widget-settings`,
    );
    return response.data;
  },

  /**
   * Update widget settings
   */
  async updateWidgetSettings(
    storeId: string,
    data: UpdateWidgetSettingsDto,
  ): Promise<WidgetSettings> {
    const response = await axiosInstance.patch<WidgetSettings>(
      `/stores/${storeId}/widget-settings`,
      data,
    );
    return response.data;
  },

  /**
   * Regenerate widget key (WARNING: This will invalidate the old widget key)
   */
  async regenerateWidgetKey(storeId: string): Promise<{ widgetKey: string }> {
    const response = await axiosInstance.post<{ widgetKey: string }>(
      `/stores/${storeId}/widget-settings/regenerate-key`,
    );
    return response.data;
  },

  /**
   * Get widget embed code
   */
  async getEmbedCode(storeId: string): Promise<WidgetEmbedCode> {
    const response = await axiosInstance.get<WidgetEmbedCode>(
      `/stores/${storeId}/widget-settings/embed-code`,
    );
    return response.data;
  },

  /**
   * Update the list of allowed domains for the public widget
   */
  async updateAllowedDomains(
    storeId: string,
    domains: string[],
  ): Promise<{ allowedDomains: string[] }> {
    const response = await axiosInstance.patch<{ allowedDomains: string[] }>(
      `/stores/${storeId}/widget-settings/allowed-domains`,
      { domains },
    );
    return response.data;
  },

  /**
   * Get widget security status (blocked/unblocked)
   */
  async getWidgetSecurityStatus(
    storeId: string,
  ): Promise<WidgetSecurityStatus> {
    const response = await axiosInstance.get<WidgetSecurityStatus>(
      `/stores/${storeId}/widget-settings/security-status`,
    );
    return response.data;
  },

  /**
   * Unblock widget access (clear auto-block flag)
   */
  async unblockWidgetAccess(storeId: string): Promise<{ unblocked: boolean }> {
    const response = await axiosInstance.post<{ unblocked: boolean }>(
      `/stores/${storeId}/widget-settings/unblock`,
    );
    return response.data;
  },
};
