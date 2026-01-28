/**
 * Feedback Service
 * API calls for appointment feedback/review management
 */

import { axiosInstance } from "./api-client";
import type {
  Feedback,
  FeedbackWithDetails,
  FeedbackStats,
  CreateFeedbackDto,
  UpdateFeedbackDto,
  RespondToFeedbackDto,
  FeedbackFilters,
  FeedbackCheckResponse,
} from "@/types";

export const feedbackService = {
  /**
   * Check if feedback can be submitted for an appointment (public)
   */
  async checkFeedbackStatus(
    storeId: string,
    appointmentId: string,
    token?: string,
  ): Promise<FeedbackCheckResponse> {
    const params = new URLSearchParams();
    if (token) params.append("token", token);

    const response = await axiosInstance.get<FeedbackCheckResponse>(
      `/stores/${storeId}/feedback/check/${appointmentId}?${params.toString()}`,
    );
    return response.data;
  },

  /**
   * Submit public feedback (no auth required)
   */
  async submitPublicFeedback(
    storeId: string,
    data: CreateFeedbackDto & { token?: string },
  ): Promise<Feedback> {
    const response = await axiosInstance.post<Feedback>(
      `/stores/${storeId}/feedback/submit`,
      data,
    );
    return response.data;
  },

  /**
   * Create feedback for an appointment
   */
  async createFeedback(
    storeId: string,
    data: CreateFeedbackDto,
  ): Promise<Feedback> {
    const response = await axiosInstance.post<Feedback>(
      `/stores/${storeId}/feedback`,
      data,
    );
    return response.data;
  },

  /**
   * Get all feedback for a store
   */
  async getFeedback(
    storeId: string,
    filters?: FeedbackFilters,
  ): Promise<FeedbackWithDetails[]> {
    const params = new URLSearchParams();

    if (filters?.customerId) params.append("customerId", filters.customerId);
    if (filters?.staffId) params.append("staffId", filters.staffId);
    if (filters?.serviceId) params.append("serviceId", filters.serviceId);
    if (filters?.limit) params.append("limit", String(filters.limit));
    if (filters?.offset) params.append("offset", String(filters.offset));

    const response = await axiosInstance.get<FeedbackWithDetails[]>(
      `/stores/${storeId}/feedback?${params.toString()}`,
    );
    return response.data;
  },

  /**
   * Get public feedback (for widget/public display)
   */
  async getPublicFeedback(
    storeId: string,
    options?: {
      staffId?: string;
      serviceId?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<FeedbackWithDetails[]> {
    const params = new URLSearchParams();

    if (options?.staffId) params.append("staffId", options.staffId);
    if (options?.serviceId) params.append("serviceId", options.serviceId);
    if (options?.limit) params.append("limit", String(options.limit));
    if (options?.offset) params.append("offset", String(options.offset));

    const response = await axiosInstance.get<FeedbackWithDetails[]>(
      `/stores/${storeId}/feedback/public?${params.toString()}`,
    );
    return response.data;
  },

  /**
   * Get feedback by ID
   */
  async getFeedbackById(
    storeId: string,
    feedbackId: string,
  ): Promise<FeedbackWithDetails> {
    const response = await axiosInstance.get<FeedbackWithDetails>(
      `/stores/${storeId}/feedback/${feedbackId}`,
    );
    return response.data;
  },

  /**
   * Update feedback
   */
  async updateFeedback(
    storeId: string,
    feedbackId: string,
    data: UpdateFeedbackDto,
  ): Promise<Feedback> {
    const response = await axiosInstance.patch<Feedback>(
      `/stores/${storeId}/feedback/${feedbackId}`,
      data,
    );
    return response.data;
  },

  /**
   * Respond to feedback (store owner/staff)
   */
  async respondToFeedback(
    storeId: string,
    feedbackId: string,
    data: RespondToFeedbackDto,
  ): Promise<Feedback> {
    const response = await axiosInstance.post<Feedback>(
      `/stores/${storeId}/feedback/${feedbackId}/respond`,
      data,
    );
    return response.data;
  },

  /**
   * Delete feedback
   */
  async deleteFeedback(storeId: string, feedbackId: string): Promise<void> {
    await axiosInstance.delete(`/stores/${storeId}/feedback/${feedbackId}`);
  },

  /**
   * Get feedback statistics
   */
  async getFeedbackStats(
    storeId: string,
    options?: {
      staffId?: string;
      serviceId?: string;
    },
  ): Promise<FeedbackStats> {
    const params = new URLSearchParams();

    if (options?.staffId) params.append("staffId", options.staffId);
    if (options?.serviceId) params.append("serviceId", options.serviceId);

    const response = await axiosInstance.get<FeedbackStats>(
      `/stores/${storeId}/feedback/stats?${params.toString()}`,
    );
    return response.data;
  },

  /**
   * Get public feedback statistics
   */
  async getPublicFeedbackStats(storeId: string): Promise<FeedbackStats> {
    const response = await axiosInstance.get<FeedbackStats>(
      `/stores/${storeId}/feedback/stats/public`,
    );
    return response.data;
  },
};
