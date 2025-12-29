/**
 * Store API Service
 */

import { axiosInstance } from "./api-client";
import type { Store } from "@/types";

export class StoreService {
  /**
   * Get current user's store
   */
  async getMyStore(): Promise<Store> {
    const response = await axiosInstance.get<Store>("/stores/my-store");
    return response.data;
  }

  /**
   * Update store
   */
  async updateStore(storeId: string, data: Partial<Store>): Promise<Store> {
    const response = await axiosInstance.patch<Store>(
      `/stores/${storeId}`,
      data
    );
    return response.data;
  }
}

export const storeService = new StoreService();
