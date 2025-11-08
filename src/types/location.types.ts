/**
 * Location Types
 * Matches backend location schema
 */

export interface Location {
  id: number;
  storeId: number;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  latitude?: string;
  longitude?: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationDto {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  latitude?: string;
  longitude?: string;
  isVisible?: boolean;
}

export interface UpdateLocationDto {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  latitude?: string;
  longitude?: string;
  isVisible?: boolean;
}
