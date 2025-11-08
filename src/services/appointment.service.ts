/**
 * Appointment API Service
 */

import { axiosInstance } from "./api-client";
import type {
  Appointment,
  CreateAppointmentDto,
  UpdateAppointmentDto,
  UpdateAppointmentStatusDto,
  AppointmentFilters,
} from "@/types";

export class AppointmentService {
  /**
   * Get appointments list with filters
   */
  async getAppointments(
    storeId: number,
    filters?: AppointmentFilters
  ): Promise<Appointment[]> {
    const response = await axiosInstance.get<Appointment[]>(
      `/stores/${storeId}/appointments`,
      { params: filters }
    );
    return response.data;
  }

  /**
   * Get single appointment
   */
  async getAppointment(storeId: number, id: number): Promise<Appointment> {
    const response = await axiosInstance.get<Appointment>(
      `/stores/${storeId}/appointments/${id}`
    );
    return response.data;
  }

  /**
   * Create new appointment
   */
  async createAppointment(
    storeId: number,
    data: CreateAppointmentDto
  ): Promise<Appointment> {
    const response = await axiosInstance.post<Appointment>(
      `/stores/${storeId}/appointments`,
      data
    );
    return response.data;
  }

  /**
   * Update appointment
   */
  async updateAppointment(
    storeId: number,
    id: number,
    data: UpdateAppointmentDto
  ): Promise<Appointment> {
    const response = await axiosInstance.patch<Appointment>(
      `/stores/${storeId}/appointments/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(
    storeId: number,
    id: number,
    data: UpdateAppointmentStatusDto
  ): Promise<Appointment> {
    const response = await axiosInstance.patch<Appointment>(
      `/stores/${storeId}/appointments/${id}/status`,
      data
    );
    return response.data;
  }

  /**
   * Delete appointment
   */
  async deleteAppointment(storeId: number, id: number): Promise<void> {
    await axiosInstance.delete(`/stores/${storeId}/appointments/${id}`);
  }
}

export const appointmentService = new AppointmentService();
