/**
 * Service Types
 * Matches backend service schema
 */

export interface ServiceExtra {
  id: string;
  name: string;
  description?: string;
  price: string; // decimal as string from backend
  duration: number;
  maxQuantity: number;
  position: number;
}

export interface Service {
  id: string;
  storeId: string;
  categoryId?: string;
  name: string;
  description?: string;
  duration: number; // minutes
  price: string; // decimal as string from backend
  capacity: number;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
  color?: string; // hex color
  image?: string;
  isVisible: boolean;
  showBringingAnyoneOption: boolean;
  allowRecurring: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
  extras?: ServiceExtra[];
}

export interface CreateServiceDto {
  name: string;
  description?: string;
  categoryId?: string;
  duration: number;
  price: number;
  capacity?: number;
  bufferTimeBefore?: number;
  bufferTimeAfter?: number;
  color?: string;
  image?: string;
  isVisible?: boolean;
  showBringingAnyoneOption?: boolean;
  allowRecurring?: boolean;
  position?: number;
}

export interface UpdateServiceDto {
  name?: string;
  description?: string;
  categoryId?: string;
  duration?: number;
  price?: number;
  capacity?: number;
  bufferTimeBefore?: number;
  bufferTimeAfter?: number;
  color?: string;
  image?: string;
  isVisible?: boolean;
  showBringingAnyoneOption?: boolean;
  allowRecurring?: boolean;
  position?: number;
}

export interface CreateServiceExtraDto {
  name: string;
  description?: string;
  price: number;
  duration?: number;
  maxQuantity?: number;
  position?: number;
}

export interface UpdateServiceExtraDto {
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
  maxQuantity?: number;
  position?: number;
}
