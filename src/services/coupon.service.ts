/**
 * Coupon Service
 * API calls for discount coupon management
 */

import { axiosInstance } from "./api-client";
import type {
  Coupon,
  CouponWithStats,
  CustomerCoupon,
  CouponAssignment,
  CreateCouponDto,
  UpdateCouponDto,
  AssignCouponDto,
  CouponValidationResult,
  CouponFilters,
} from "@/types";

export const couponService = {
  /**
   * Create a new coupon
   */
  async createCoupon(storeId: string, data: CreateCouponDto): Promise<Coupon> {
    const response = await axiosInstance.post<Coupon>(
      `/stores/${storeId}/coupons`,
      data
    );
    return response.data;
  },

  /**
   * Get all coupons for a store
   */
  async getCoupons(
    storeId: string,
    filters?: CouponFilters
  ): Promise<Coupon[]> {
    const params = new URLSearchParams();

    if (filters?.search) params.append("search", filters.search);
    if (filters?.isActive !== undefined)
      params.append("isActive", String(filters.isActive));
    if (filters?.includeExpired)
      params.append("includeExpired", String(filters.includeExpired));

    const response = await axiosInstance.get<Coupon[]>(
      `/stores/${storeId}/coupons?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get a single coupon by ID with stats
   */
  async getCoupon(storeId: string, couponId: string): Promise<CouponWithStats> {
    const response = await axiosInstance.get<CouponWithStats>(
      `/stores/${storeId}/coupons/${couponId}`
    );
    return response.data;
  },

  /**
   * Update a coupon
   */
  async updateCoupon(
    storeId: string,
    couponId: string,
    data: UpdateCouponDto
  ): Promise<Coupon> {
    const response = await axiosInstance.patch<Coupon>(
      `/stores/${storeId}/coupons/${couponId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete a coupon
   */
  async deleteCoupon(storeId: string, couponId: string): Promise<void> {
    await axiosInstance.delete(`/stores/${storeId}/coupons/${couponId}`);
  },

  /**
   * Assign coupon to customers
   */
  async assignCouponToCustomers(
    storeId: string,
    couponId: string,
    data: AssignCouponDto
  ): Promise<CustomerCoupon[]> {
    const response = await axiosInstance.post<CustomerCoupon[]>(
      `/stores/${storeId}/coupons/${couponId}/assign`,
      data
    );
    return response.data;
  },

  /**
   * Get coupon assignments (customers assigned to a coupon)
   */
  async getCouponAssignments(
    storeId: string,
    couponId: string
  ): Promise<CouponAssignment[]> {
    const response = await axiosInstance.get<CouponAssignment[]>(
      `/stores/${storeId}/coupons/${couponId}/assignments`
    );
    return response.data;
  },

  /**
   * Remove customer from coupon assignment
   */
  async removeCustomerFromCoupon(
    storeId: string,
    couponId: string,
    customerId: string
  ): Promise<void> {
    await axiosInstance.delete(
      `/stores/${storeId}/coupons/${couponId}/assignments/${customerId}`
    );
  },

  /**
   * Get coupons assigned to a customer
   */
  async getCustomerCoupons(
    storeId: string,
    customerId: string
  ): Promise<CustomerCoupon[]> {
    const response = await axiosInstance.get<CustomerCoupon[]>(
      `/stores/${storeId}/coupons/customer/${customerId}`
    );
    return response.data;
  },

  /**
   * Validate a coupon code
   */
  async validateCoupon(
    storeId: string,
    code: string,
    options?: {
      customerId?: string;
      serviceId?: string;
      amount?: number;
    }
  ): Promise<CouponValidationResult> {
    const response = await axiosInstance.post<CouponValidationResult>(
      `/stores/${storeId}/coupons/validate`,
      {
        code,
        ...options,
      }
    );
    return response.data;
  },
};
