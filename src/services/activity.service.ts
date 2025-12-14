import { axiosInstance } from "./api-client";
import type { RecentActivity } from "@/types";

class ActivityService {
  async getRecentActivities(
    storeId: number,
    limit = 20
  ): Promise<RecentActivity[]> {
    const response = await axiosInstance.get<RecentActivity[]>(
      `/stores/${storeId}/activities`,
      { params: { limit } }
    );
    return response.data;
  }
}

export const activityService = new ActivityService();
