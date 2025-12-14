/**
 * Staff API Service
 */

import { axiosInstance } from "./api-client";
import type {
  StaffMember,
  StaffInvitation,
  InviteStaffDto,
  UpdateStaffProfileDto,
  AssignServicesDto,
  WorkingHours,
  CreateWorkingHoursDto,
  UpdateWorkingHoursDto,
  StaffBreak,
  CreateStaffBreakDto,
  UpdateStaffBreakDto,
} from "@/types";
import type { Service } from "@/types";

export class StaffService {
  // ============= Staff Invitations =============

  /**
   * Invite a staff member via email
   */
  async inviteStaff(
    storeId: number,
    data: InviteStaffDto
  ): Promise<StaffInvitation> {
    const response = await axiosInstance.post<StaffInvitation>(
      `/stores/${storeId}/staff/invite`,
      data
    );
    return response.data;
  }

  /**
   * Get all pending invitations
   */
  async getInvitations(storeId: number): Promise<StaffInvitation[]> {
    const response = await axiosInstance.get<StaffInvitation[]>(
      `/stores/${storeId}/staff/invitations`
    );
    return response.data;
  }

  /**
   * Delete (cancel) an invitation
   */
  async deleteInvitation(storeId: number, invitationId: number): Promise<void> {
    await axiosInstance.delete(
      `/stores/${storeId}/staff/invitations/${invitationId}`
    );
  }

  // ============= Staff Management =============

  /**
   * Get all staff members
   */
  async getStaffMembers(
    storeId: number,
    includeHiddenOrOptions:
      | boolean
      | {
          includeHidden?: boolean;
          serviceId?: number;
          locationId?: number;
        } = false
  ): Promise<StaffMember[]> {
    const options =
      typeof includeHiddenOrOptions === "boolean"
        ? { includeHidden: includeHiddenOrOptions }
        : includeHiddenOrOptions;

    const response = await axiosInstance.get<StaffMember[]>(
      `/stores/${storeId}/staff`,
      {
        params: {
          includeHidden: options.includeHidden ? "true" : "false",
          serviceId: options.serviceId,
          locationId: options.locationId,
        },
      }
    );
    return response.data;
  }

  /**
   * Get a single staff member
   */
  async getStaffMember(storeId: number, staffId: number): Promise<StaffMember> {
    const response = await axiosInstance.get<StaffMember>(
      `/stores/${storeId}/staff/${staffId}`
    );
    return response.data;
  }

  /**
   * Update staff profile
   */
  async updateStaffProfile(
    storeId: number,
    staffId: number,
    data: UpdateStaffProfileDto
  ): Promise<StaffMember> {
    const response = await axiosInstance.patch<StaffMember>(
      `/stores/${storeId}/staff/${staffId}`,
      data
    );
    return response.data;
  }

  /**
   * Delete a staff member
   */
  async deleteStaffMember(storeId: number, staffId: number): Promise<void> {
    await axiosInstance.delete(`/stores/${storeId}/staff/${staffId}`);
  }

  // ============= Service Assignments =============

  /**
   * Assign services to a staff member
   */
  async assignServices(
    storeId: number,
    staffId: number,
    data: AssignServicesDto
  ): Promise<Service[]> {
    const response = await axiosInstance.post<Service[]>(
      `/stores/${storeId}/staff/${staffId}/services`,
      data
    );
    return response.data;
  }

  /**
   * Get staff member's assigned services
   */
  async getStaffServices(storeId: number, staffId: number): Promise<Service[]> {
    const response = await axiosInstance.get<Service[]>(
      `/stores/${storeId}/staff/${staffId}/services`
    );
    return response.data;
  }

  /**
   * Remove a service from staff member
   */
  async removeServiceFromStaff(
    storeId: number,
    staffId: number,
    serviceId: number
  ): Promise<void> {
    await axiosInstance.delete(
      `/stores/${storeId}/staff/${staffId}/services/${serviceId}`
    );
  }

  // ============= Working Hours =============

  /**
   * Create working hours for a staff member
   */
  async createWorkingHours(
    storeId: number,
    staffId: number,
    data: CreateWorkingHoursDto
  ): Promise<WorkingHours> {
    const response = await axiosInstance.post<WorkingHours>(
      `/stores/${storeId}/staff/${staffId}/working-hours`,
      data
    );
    return response.data;
  }

  /**
   * Get staff member's working hours
   */
  async getWorkingHours(
    storeId: number,
    staffId: number
  ): Promise<WorkingHours[]> {
    const response = await axiosInstance.get<WorkingHours[]>(
      `/stores/${storeId}/staff/${staffId}/working-hours`
    );
    return response.data;
  }

  /**
   * Update working hours
   */
  async updateWorkingHours(
    storeId: number,
    staffId: number,
    workingHoursId: number,
    data: UpdateWorkingHoursDto
  ): Promise<WorkingHours> {
    const response = await axiosInstance.patch<WorkingHours>(
      `/stores/${storeId}/staff/${staffId}/working-hours/${workingHoursId}`,
      data
    );
    return response.data;
  }

  /**
   * Delete working hours
   */
  async deleteWorkingHours(
    storeId: number,
    staffId: number,
    workingHoursId: number
  ): Promise<void> {
    await axiosInstance.delete(
      `/stores/${storeId}/staff/${staffId}/working-hours/${workingHoursId}`
    );
  }

  // ============= Breaks & Time Off =============

  /**
   * Create a break/time off
   */
  async createStaffBreak(
    storeId: number,
    staffId: number,
    data: CreateStaffBreakDto
  ): Promise<StaffBreak> {
    const response = await axiosInstance.post<StaffBreak>(
      `/stores/${storeId}/staff/${staffId}/breaks`,
      data
    );
    return response.data;
  }

  /**
   * Get staff member's breaks
   */
  async getStaffBreaks(
    storeId: number,
    staffId: number
  ): Promise<StaffBreak[]> {
    const response = await axiosInstance.get<StaffBreak[]>(
      `/stores/${storeId}/staff/${staffId}/breaks`
    );
    return response.data;
  }

  /**
   * Update a break
   */
  async updateStaffBreak(
    storeId: number,
    staffId: number,
    breakId: number,
    data: UpdateStaffBreakDto
  ): Promise<StaffBreak> {
    const response = await axiosInstance.patch<StaffBreak>(
      `/stores/${storeId}/staff/${staffId}/breaks/${breakId}`,
      data
    );
    return response.data;
  }

  /**
   * Delete a break
   */
  async deleteStaffBreak(
    storeId: number,
    staffId: number,
    breakId: number
  ): Promise<void> {
    await axiosInstance.delete(
      `/stores/${storeId}/staff/${staffId}/breaks/${breakId}`
    );
  }
}

export const staffService = new StaffService();
