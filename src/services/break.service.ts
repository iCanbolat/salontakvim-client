/**
 * Staff Break/Time Off API Service
 */

import { axiosInstance } from "./api-client";
import type {
  StaffBreak,
  CreateStaffBreakDto,
  UpdateStaffBreakDto,
  StaffBreakWithStaff,
  StaffBreakStatus,
  PaginatedResponse,
  PaginationParams,
} from "@/types";

export class BreakService {
  /**
   * Get all breaks for a staff member
   */
  async getStaffBreaks(
    storeId: string,
    staffId: string,
  ): Promise<StaffBreak[]> {
    const response = await axiosInstance.get<StaffBreak[]>(
      `/stores/${storeId}/staff/${staffId}/breaks`,
    );
    return response.data;
  }

  /**
   * Create a new break for a staff member
   */
  async createStaffBreak(
    storeId: string,
    staffId: string,
    data: CreateStaffBreakDto,
  ): Promise<StaffBreak> {
    const response = await axiosInstance.post<StaffBreak>(
      `/stores/${storeId}/staff/${staffId}/breaks`,
      data,
    );
    return response.data;
  }

  /**
   * Update a staff break
   */
  async updateStaffBreak(
    storeId: string,
    staffId: string,
    breakId: string,
    data: UpdateStaffBreakDto,
  ): Promise<StaffBreak> {
    const response = await axiosInstance.patch<StaffBreak>(
      `/stores/${storeId}/staff/${staffId}/breaks/${breakId}`,
      data,
    );
    return response.data;
  }

  /**
   * Delete a staff break
   */
  async deleteStaffBreak(
    storeId: string,
    staffId: string,
    breakId: string,
  ): Promise<void> {
    await axiosInstance.delete(
      `/stores/${storeId}/staff/${staffId}/breaks/${breakId}`,
    );
  }

  async getStoreBreaks(
    storeId: string,
    status?: StaffBreakStatus,
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<StaffBreakWithStaff>> {
    const response = await axiosInstance.get<
      PaginatedResponse<StaffBreakWithStaff>
    >(`/stores/${storeId}/breaks`, {
      params: {
        ...(status ? { status } : {}),
        ...(pagination?.page ? { page: pagination.page } : {}),
        ...(pagination?.limit ? { limit: pagination.limit } : {}),
      },
    });

    return response.data;
  }
}

export const breakService = new BreakService();
