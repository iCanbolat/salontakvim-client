/**
 * Public widget service for hosted booking pages
 */

import { axiosInstance } from "./api-client";
import type { Location } from "@/types/location.types";
import type {
  WidgetEmbedBootstrap,
  WidgetPublicConfig,
} from "@/types/widget.types";

class WidgetPublicService {
  async getWidgetConfigBySlug(
    slug: string,
    token?: string,
  ): Promise<WidgetPublicConfig> {
    const response = await axiosInstance.get<WidgetPublicConfig>(
      `/public/store/${slug}/widget-config`,
      token
        ? {
            params: { token },
          }
        : undefined,
    );

    return response.data;
  }

  async getEmbedBootstrap(slug: string): Promise<WidgetEmbedBootstrap> {
    const response = await axiosInstance.get<WidgetEmbedBootstrap>(
      `/public/embed/${slug}/bootstrap`,
    );

    return response.data;
  }

  async getPublicLocations(slug: string, token?: string): Promise<Location[]> {
    const response = await axiosInstance.get<{ locations: Location[] }>(
      `/public/store/${slug}/locations`,
      token
        ? {
            params: { token },
          }
        : undefined,
    );
    return response.data.locations || [];
  }
}

export const widgetPublicService = new WidgetPublicService();
