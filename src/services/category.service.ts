/**
 * Category API Service
 */

import { axiosInstance } from "./api-client";
import type {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  ReorderCategoriesDto,
} from "@/types";

export class CategoryService {
  /**
   * Get all categories for a store
   */
  async getCategories(storeId: string): Promise<Category[]> {
    const response = await axiosInstance.get<Category[]>(
      `/stores/${storeId}/categories`
    );
    return response.data;
  }

  /**
   * Get a single category
   */
  async getCategory(storeId: string, categoryId: string): Promise<Category> {
    const response = await axiosInstance.get<Category>(
      `/stores/${storeId}/categories/${categoryId}`
    );
    return response.data;
  }

  /**
   * Create a new category
   */
  async createCategory(
    storeId: string,
    data: CreateCategoryDto
  ): Promise<Category> {
    const response = await axiosInstance.post<Category>(
      `/stores/${storeId}/categories`,
      data
    );
    return response.data;
  }

  /**
   * Update a category
   */
  async updateCategory(
    storeId: string,
    categoryId: string,
    data: UpdateCategoryDto
  ): Promise<Category> {
    const response = await axiosInstance.patch<Category>(
      `/stores/${storeId}/categories/${categoryId}`,
      data
    );
    return response.data;
  }

  /**
   * Delete a category
   */
  async deleteCategory(storeId: string, categoryId: string): Promise<void> {
    await axiosInstance.delete(`/stores/${storeId}/categories/${categoryId}`);
  }

  /**
   * Reorder categories
   */
  async reorderCategories(
    storeId: string,
    data: ReorderCategoriesDto
  ): Promise<Category[]> {
    const response = await axiosInstance.patch<Category[]>(
      `/stores/${storeId}/categories`,
      data
    );
    return response.data;
  }
}

export const categoryService = new CategoryService();
