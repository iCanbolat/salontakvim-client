import { axiosInstance } from "./api-client";
import type { PaginatedResponse, RecentActivity } from "@/types";

class ActivityService {
  async getRecentActivities(
    storeId: string,
    options?: { limit?: number; locationId?: string },
  ): Promise<RecentActivity[]> {
    const limit = options?.limit ?? 10;
    const response = await axiosInstance.get<RecentActivity[]>(
      `/stores/${storeId}/activities`,
      { params: { limit, locationId: options?.locationId } },
    );
    return response.data;
  }

  async getActivitiesPaginated(params: {
    storeId: string;
    page: number;
    limit: number;
    type?: string;
    locationId?: string;
  }): Promise<PaginatedResponse<RecentActivity>> {
    const { storeId, page, limit, type, locationId } = params;
    const response = await axiosInstance.get<PaginatedResponse<RecentActivity>>(
      `/stores/${storeId}/activities`,
      { params: { page, limit, type, locationId } },
    );
    return response.data;
  }
}

export const activityService = new ActivityService();
