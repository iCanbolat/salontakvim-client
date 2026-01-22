/**
 * Central type exports
 */

export * from "./user.types";
export * from "./store.types";
export * from "./analytics.types";
export * from "./appointment.types";
export * from "./service.types";
export * from "./category.types";
export * from "./staff.types";
export * from "./location.types";
export * from "./customer.types";
export * from "./coupon.types";
export * from "./feedback.types";

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
