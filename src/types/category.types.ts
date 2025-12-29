/**
 * Category Types
 * Matches backend category schema
 */

export interface Category {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  color?: string; // hex color
  icon?: string;
  position: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  position?: number;
  isVisible?: boolean;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  position?: number;
  isVisible?: boolean;
}

export interface ReorderCategoriesDto {
  categoryIds: string[];
}
