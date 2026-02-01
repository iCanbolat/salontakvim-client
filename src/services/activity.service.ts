import { axiosInstance } from "./api-client";
import type { PaginatedResponse, RecentActivity } from "@/types";

class ActivityService {
  async getRecentActivities(
    storeId: string,
    limit = 10,
  ): Promise<RecentActivity[]> {
    const response = await axiosInstance.get<RecentActivity[]>(
      `/stores/${storeId}/activities`,
      { params: { limit } },
    );
    return response.data;
  }

  async getActivitiesPaginated(params: {
    storeId: string;
    page: number;
    limit: number;
    type?: string;
  }): Promise<PaginatedResponse<RecentActivity>> {
    const { storeId, page, limit, type } = params;
    const response = await axiosInstance.get<PaginatedResponse<RecentActivity>>(
      `/stores/${storeId}/activities`,
      { params: { page, limit, type } },
    );
    return response.data;
  }
}

export const activityService = new ActivityService();
