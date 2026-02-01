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
      data,
    );
    return response.data;
  }

  /**
   * Upload a store image
   */
  async uploadStoreImage(
    storeId: string,
    file: File,
  ): Promise<{ imageUrl: string; storeImages: string[] }> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosInstance.post<{
      imageUrl: string;
      storeImages: string[];
    }>(`/stores/${storeId}/store-images`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  /**
   * Delete a store image
   */
  async deleteStoreImage(
    storeId: string,
    imageUrl: string,
  ): Promise<{ storeImages: string[] }> {
    const response = await axiosInstance.delete<{ storeImages: string[] }>(
      `/stores/${storeId}/store-images`,
      {
        data: { imageUrl },
      },
    );
    return response.data;
  }

  /**
   * Reorder store images
   */
  async reorderStoreImages(
    storeId: string,
    imageUrls: string[],
  ): Promise<{ storeImages: string[] }> {
    const response = await axiosInstance.patch<{ storeImages: string[] }>(
      `/stores/${storeId}/store-images/reorder`,
      { imageUrls },
    );
    return response.data;
  }
}

export const storeService = new StoreService();
