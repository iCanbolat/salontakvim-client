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
  PaginatedAppointmentsResponse,
  AvailabilityResponse,
  SettleAppointmentPaymentDto,
} from "@/types";

export class AppointmentService {
  /**
   * Get appointments list with filters
   */
  async getAppointments(
    storeId: string,
    filters?: AppointmentFilters,
  ): Promise<PaginatedAppointmentsResponse> {
    // Normalize array filters for reliable serialization across browsers/axios
    const params: Record<string, any> = { ...filters };

    if (filters?.staffIds?.length) {
      // Send as comma-separated list so the API DTO can parse it regardless of [] array notation
      params.staffIds = filters.staffIds.join(",");
    }

    const response = await axiosInstance.get<PaginatedAppointmentsResponse>(
      `/stores/${storeId}/appointments`,
      { params },
    );
    return response.data;
  }

  /**
   * Get single appointment
   */
  async getAppointment(storeId: string, id: string): Promise<Appointment> {
    const response = await axiosInstance.get<Appointment>(
      `/stores/${storeId}/appointments/${id}`,
    );
    return response.data;
  }

  /**
   * Create new appointment
   */
  async createAppointment(
    storeId: string,
    data: CreateAppointmentDto,
  ): Promise<Appointment> {
    const response = await axiosInstance.post<Appointment>(
      `/stores/${storeId}/appointments`,
      data,
    );
    return response.data;
  }

  /**
   * Update appointment
   */
  async updateAppointment(
    storeId: string,
    id: string,
    data: UpdateAppointmentDto,
  ): Promise<Appointment> {
    const response = await axiosInstance.patch<Appointment>(
      `/stores/${storeId}/appointments/${id}`,
      data,
    );
    return response.data;
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(
    storeId: string,
    id: string,
    data: UpdateAppointmentStatusDto,
  ): Promise<Appointment> {
    const response = await axiosInstance.patch<Appointment>(
      `/stores/${storeId}/appointments/${id}/status`,
      data,
    );
    return response.data;
  }

  async settleAppointmentPayment(
    storeId: string,
    id: string,
    data: SettleAppointmentPaymentDto,
  ): Promise<Appointment> {
    const response = await axiosInstance.patch<Appointment>(
      `/stores/${storeId}/appointments/${id}/settle-payment`,
      data,
    );
    return response.data;
  }

  /**
   * Get appointment details by public token
   */
  async getAppointmentByToken(token: string): Promise<Appointment> {
    const response = await axiosInstance.get<Appointment>(
      `/public/appointments/cancel-details`,
      {
        params: { token },
      },
    );
    return response.data;
  }

  /**
   * Cancel appointment by public token
   */
  async cancelAppointmentByToken(
    token: string,
    reason?: string,
  ): Promise<Appointment> {
    const response = await axiosInstance.post<Appointment>(
      `/public/appointments/cancel`,
      { token, reason },
    );
    return response.data;
  }

  /**
   * Delete appointment
   */
  async deleteAppointment(storeId: string, id: string): Promise<void> {
    await axiosInstance.delete(`/stores/${storeId}/appointments/${id}`);
  }

  /**
   * Get availability time slots for a staff/service/date
   */
  async getAvailability(params: {
    storeId: string;
    serviceId: string;
    staffId: string;
    date: string;
    locationId?: string;
    excludeAppointmentId?: string;
  }): Promise<AvailabilityResponse> {
    const { storeId, ...query } = params;

    const response = await axiosInstance.get<AvailabilityResponse>(
      `/stores/${storeId}/availability`,
      {
        params: query,
      },
    );

    return response.data;
  }
}

export const appointmentService = new AppointmentService();
