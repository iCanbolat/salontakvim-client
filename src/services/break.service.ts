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
} from "@/types";

export class BreakService {
  /**
   * Get all breaks for a staff member
   */
  async getStaffBreaks(
    storeId: number,
    staffId: number
  ): Promise<StaffBreak[]> {
    const response = await axiosInstance.get<StaffBreak[]>(
      `/stores/${storeId}/staff/${staffId}/breaks`
    );
    return response.data;
  }

  /**
   * Create a new break for a staff member
   */
  async createStaffBreak(
    storeId: number,
    staffId: number,
    data: CreateStaffBreakDto
  ): Promise<StaffBreak> {
    const response = await axiosInstance.post<StaffBreak>(
      `/stores/${storeId}/staff/${staffId}/breaks`,
      data
    );
    return response.data;
  }

  /**
   * Update a staff break
   */
  async updateStaffBreak(
    storeId: number,
    staffId: number,
    breakId: number,
    data: UpdateStaffBreakDto
  ): Promise<StaffBreak> {
    const response = await axiosInstance.patch<StaffBreak>(
      `/stores/${storeId}/staff/${staffId}/breaks/${breakId}`,
      data
    );
    return response.data;
  }

  /**
   * Delete a staff break
   */
  async deleteStaffBreak(
    storeId: number,
    staffId: number,
    breakId: number
  ): Promise<void> {
    await axiosInstance.delete(
      `/stores/${storeId}/staff/${staffId}/breaks/${breakId}`
    );
  }

  async getStoreBreaks(
    storeId: number,
    status?: StaffBreakStatus
  ): Promise<StaffBreakWithStaff[]> {
    const response = await axiosInstance.get<StaffBreakWithStaff[]>(
      `/stores/${storeId}/breaks`,
      {
        params: status ? { status } : undefined,
      }
    );

    return response.data;
  }
}

export const breakService = new BreakService();
