/**
 * Store Types
 * Matches backend store schema
 */

export interface Store {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  email?: string;
  phone?: string;
  currency: string;
  storeImages?: string[];
  totalAppointments: number;
  totalCustomers: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateStoreDto {
  name?: string;
  slug?: string;
  description?: string;
  logo?: string;
  email?: string;
  phone?: string;
  currency?: string;
}
