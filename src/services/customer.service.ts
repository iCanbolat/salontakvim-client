/**
 * Customer Service
 * API calls for customer management
 */

import { axiosInstance } from "./api-client";
import type {
  CustomerWithStats,
  CustomerProfile,
  CustomerFilters,
  UpdateCustomerDto,
  PaginatedResponse,
  SendBulkSmsDto,
  BulkSmsResult,
} from "@/types";

/**
 * Get all customers for a store
 * Since there's no dedicated customer endpoint, we'll get customers from appointments
 */
export const customerService = {
  /**
   * Get customers list with statistics
   * Note: This is a simplified version. In production, backend should provide a dedicated endpoint.
   */
  async getCustomers(
    storeId: string,
    filters?: CustomerFilters,
  ): Promise<PaginatedResponse<CustomerWithStats>> {
    const params = new URLSearchParams();

    if (filters?.search) params.append("search", filters.search);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.sortBy) params.append("sortBy", filters.sortBy);
    if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);

    const response = await axiosInstance.get<
      PaginatedResponse<CustomerWithStats>
    >(`/stores/${storeId}/customers?${params.toString()}`);
    return response.data;
  },

  /**
   * Get customer profile with appointment history
   * @param customerId - Customer UUID
   */
  async getCustomerProfile(
    storeId: string,
    customerId: string,
  ): Promise<CustomerProfile> {
    const response = await axiosInstance.get<CustomerProfile>(
      `/stores/${storeId}/customers/${customerId}`,
    );
    return response.data;
  },

  /**
   * Update customer information
   */
  async updateCustomer(
    storeId: string,
    customerId: string,
    data: UpdateCustomerDto,
  ): Promise<CustomerWithStats> {
    const response = await axiosInstance.patch<CustomerWithStats>(
      `/stores/${storeId}/customers/${customerId}`,
      data,
    );
    return response.data;
  },

  /**
   * Delete customer (soft delete - deactivate)
   */
  async deleteCustomer(storeId: string, customerId: string): Promise<void> {
    await axiosInstance.delete(`/stores/${storeId}/customers/${customerId}`);
  },

  /**
   * Get customer appointments
   */
  async getCustomerAppointments(storeId: string, customerId: string) {
    const response = await axiosInstance.get(
      `/stores/${storeId}/appointments?customerId=${customerId}`,
    );
    return response.data;
  },

  /**
   * Search customers by name, email, or phone
   */
  async searchCustomers(
    storeId: string,
    query: string,
  ): Promise<CustomerWithStats[]> {
    const response = await axiosInstance.get<CustomerWithStats[]>(
      `/stores/${storeId}/customers/search?q=${encodeURIComponent(query)}`,
    );
    return response.data;
  },

  async sendBulkSms(
    storeId: string,
    data: SendBulkSmsDto,
  ): Promise<BulkSmsResult> {
    const response = await axiosInstance.post<BulkSmsResult>(
      `/stores/${storeId}/customers/sms`,
      data,
    );
    return response.data;
  },
};
