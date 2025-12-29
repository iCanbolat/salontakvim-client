/**
 * Service API Service
 */

import { axiosInstance } from "./api-client";
import type {
  Service,
  CreateServiceDto,
  UpdateServiceDto,
  ServiceExtra,
  CreateServiceExtraDto,
  UpdateServiceExtraDto,
} from "@/types";

export class ServiceService {
  /**
   * Get all services for a store
   */
  async getServices(storeId: string): Promise<Service[]> {
    const response = await axiosInstance.get<Service[]>(
      `/stores/${storeId}/services`
    );
    return response.data;
  }

  /**
   * Get visible services for a store (public)
   */
  async getVisibleServices(storeId: string): Promise<Service[]> {
    const response = await axiosInstance.get<Service[]>(
      `/stores/${storeId}/services/visible`
    );
    return response.data;
  }

  /**
   * Get a single service
   */
  async getService(storeId: string, serviceId: string): Promise<Service> {
    const response = await axiosInstance.get<Service>(
      `/stores/${storeId}/services/${serviceId}`
    );
    return response.data;
  }

  /**
   * Create a new service
   */
  async createService(
    storeId: string,
    data: CreateServiceDto
  ): Promise<Service> {
    const response = await axiosInstance.post<Service>(
      `/stores/${storeId}/services`,
      data
    );
    return response.data;
  }

  /**
   * Update a service
   */
  async updateService(
    storeId: string,
    serviceId: string,
    data: UpdateServiceDto
  ): Promise<Service> {
    const response = await axiosInstance.patch<Service>(
      `/stores/${storeId}/services/${serviceId}`,
      data
    );
    return response.data;
  }

  /**
   * Delete a service
   */
  async deleteService(storeId: string, serviceId: string): Promise<void> {
    await axiosInstance.delete(`/stores/${storeId}/services/${serviceId}`);
  }

  // Service Extras Methods

  /**
   * Get all extras for a service
   */
  async getServiceExtras(
    storeId: string,
    serviceId: string
  ): Promise<ServiceExtra[]> {
    const response = await axiosInstance.get<ServiceExtra[]>(
      `/stores/${storeId}/services/${serviceId}/extras`
    );
    return response.data;
  }

  /**
   * Create a new service extra
   */
  async createServiceExtra(
    storeId: string,
    serviceId: string,
    data: CreateServiceExtraDto
  ): Promise<ServiceExtra> {
    const response = await axiosInstance.post<ServiceExtra>(
      `/stores/${storeId}/services/${serviceId}/extras`,
      data
    );
    return response.data;
  }

  /**
   * Update a service extra
   */
  async updateServiceExtra(
    storeId: string,
    serviceId: string,
    extraId: string,
    data: UpdateServiceExtraDto
  ): Promise<ServiceExtra> {
    const response = await axiosInstance.patch<ServiceExtra>(
      `/stores/${storeId}/services/${serviceId}/extras/${extraId}`,
      data
    );
    return response.data;
  }

  /**
   * Delete a service extra
   */
  async deleteServiceExtra(
    storeId: string,
    serviceId: string,
    extraId: string
  ): Promise<void> {
    await axiosInstance.delete(
      `/stores/${storeId}/services/${serviceId}/extras/${extraId}`
    );
  }
}

export const serviceService = new ServiceService();
