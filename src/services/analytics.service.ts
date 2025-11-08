/**
 * Analytics API Service
 */

import { axiosInstance } from "./api-client";
import type {
  DashboardResponse,
  AppointmentAnalyticsResponse,
  RevenueAnalyticsResponse,
  AnalyticsQuery,
} from "@/types";

export class AnalyticsService {
  /**
   * Get dashboard statistics
   */
  async getDashboard(
    storeId: number,
    query?: AnalyticsQuery
  ): Promise<DashboardResponse> {
    const response = await axiosInstance.get<DashboardResponse>(
      `/stores/${storeId}/analytics/dashboard`,
      { params: query }
    );
    return response.data;
  }

  /**
   * Get appointment analytics
   */
  async getAppointmentAnalytics(
    storeId: number,
    query?: AnalyticsQuery
  ): Promise<AppointmentAnalyticsResponse> {
    const response = await axiosInstance.get<AppointmentAnalyticsResponse>(
      `/stores/${storeId}/analytics/appointments`,
      { params: query }
    );
    return response.data;
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(
    storeId: number,
    query?: AnalyticsQuery
  ): Promise<RevenueAnalyticsResponse> {
    const response = await axiosInstance.get<RevenueAnalyticsResponse>(
      `/stores/${storeId}/analytics/revenue`,
      { params: query }
    );
    return response.data;
  }
}

export const analyticsService = new AnalyticsService();
