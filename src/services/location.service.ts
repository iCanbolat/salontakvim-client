/**
 * Location API Service
 */

import { axiosInstance } from "./api-client";
import type { Location, CreateLocationDto, UpdateLocationDto } from "@/types";

export class LocationService {
  /**
   * Get all locations for a store
   */
  async getLocations(storeId: number): Promise<Location[]> {
    const response = await axiosInstance.get<Location[]>(
      `/stores/${storeId}/locations`
    );
    return response.data;
  }

  /**
   * Get visible locations for a store (public endpoint)
   */
  async getVisibleLocations(storeId: number): Promise<Location[]> {
    const response = await axiosInstance.get<Location[]>(
      `/stores/${storeId}/locations/visible`
    );
    return response.data;
  }

  /**
   * Get a single location
   */
  async getLocation(storeId: number, locationId: number): Promise<Location> {
    const response = await axiosInstance.get<Location>(
      `/stores/${storeId}/locations/${locationId}`
    );
    return response.data;
  }

  /**
   * Create a new location
   */
  async createLocation(
    storeId: number,
    data: CreateLocationDto
  ): Promise<Location> {
    const response = await axiosInstance.post<Location>(
      `/stores/${storeId}/locations`,
      data
    );
    return response.data;
  }

  /**
   * Update a location
   */
  async updateLocation(
    storeId: number,
    locationId: number,
    data: UpdateLocationDto
  ): Promise<Location> {
    const response = await axiosInstance.patch<Location>(
      `/stores/${storeId}/locations/${locationId}`,
      data
    );
    return response.data;
  }

  /**
   * Delete a location
   */
  async deleteLocation(storeId: number, locationId: number): Promise<void> {
    await axiosInstance.delete(`/stores/${storeId}/locations/${locationId}`);
  }
}

export const locationService = new LocationService();
