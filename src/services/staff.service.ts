/**
 * Staff API Service
 */

import { axiosInstance } from "./api-client";
import type {
  StaffMember,
  StaffInvitation,
  InviteStaffDto,
  AcceptStaffInvitationDto,
  StaffInvitationDetails,
  UpdateStaffProfileDto,
  AssignServicesDto,
  WorkingHours,
  CreateWorkingHoursDto,
  UpdateWorkingHoursDto,
  StaffBreak,
  CreateStaffBreakDto,
  UpdateStaffBreakDto,
  StaffDetailsResponse,
} from "@/types";
import type { Service } from "@/types";

export class StaffService {
  // ============= Staff Invitations =============

  /**
   * Invite a staff member via email
   */
  async inviteStaff(
    storeId: string,
    data: InviteStaffDto,
  ): Promise<StaffInvitation> {
    const response = await axiosInstance.post<StaffInvitation>(
      `/stores/${storeId}/staff/invite`,
      data,
    );
    return response.data;
  }

  /**
   * Get all pending invitations
   */
  async getInvitations(storeId: string): Promise<StaffInvitation[]> {
    const response = await axiosInstance.get<StaffInvitation[]>(
      `/stores/${storeId}/staff/invitations`,
    );
    return response.data;
  }

  /**
   * Get invitation details by token (public)
   */
  async getInvitationByToken(token: string): Promise<StaffInvitationDetails> {
    const response = await axiosInstance.get<StaffInvitationDetails>(
      `/staff/invitations/${token}`,
    );
    return response.data;
  }

  /**
   * Accept staff invitation (public)
   */
  async acceptInvitation(
    token: string,
    data: AcceptStaffInvitationDto,
  ): Promise<{ user: { email: string } }> {
    const response = await axiosInstance.post<{ user: { email: string } }>(
      `/staff/invitations/${token}/accept`,
      data,
    );
    return response.data;
  }

  /**
   * Delete (cancel) an invitation
   */
  async deleteInvitation(storeId: string, invitationId: string): Promise<void> {
    await axiosInstance.delete(
      `/stores/${storeId}/staff/invitations/${invitationId}`,
    );
  }

  // ============= Staff Management =============

  /**
   * Get all staff members
   */
  async getStaffMembers(
    storeId: string,
    includeHiddenOrOptions:
      | boolean
      | {
          includeHidden?: boolean;
          serviceId?: string;
          locationId?: string;
          search?: string;
        } = false,
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
          search: options.search,
        },
      },
    );
    return response.data;
  }

  /**
   * Get a single staff member
   */
  async getStaffMember(
    storeId: string,
    staffId: string,
  ): Promise<StaffDetailsResponse> {
    const response = await axiosInstance.get<StaffDetailsResponse>(
      `/stores/${storeId}/staff/${staffId}`,
    );
    return response.data;
  }

  /**
   * Update staff profile
   */
  async updateStaffProfile(
    storeId: string,
    staffId: string,
    data: UpdateStaffProfileDto,
  ): Promise<StaffMember> {
    const response = await axiosInstance.patch<StaffMember>(
      `/stores/${storeId}/staff/${staffId}`,
      data,
    );
    return response.data;
  }

  /**
   * Create staff profile for the current admin user
   */
  async createSelfStaffProfile(
    storeId: string,
    data: UpdateStaffProfileDto,
  ): Promise<StaffMember> {
    const response = await axiosInstance.post<StaffMember>(
      `/stores/${storeId}/staff/self`,
      data,
    );
    return response.data;
  }

  /**
   * Upload staff avatar
   */
  async uploadStaffAvatar(
    storeId: string,
    staffId: string,
    file: File,
  ): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosInstance.post<{ avatarUrl: string }>(
      `/stores/${storeId}/staff/${staffId}/avatar`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  }

  /**
   * Delete a staff member
   */
  async deleteStaffMember(storeId: string, staffId: string): Promise<void> {
    await axiosInstance.delete(`/stores/${storeId}/staff/${staffId}`);
  }

  // ============= Service Assignments =============

  /**
   * Assign services to a staff member
   */
  async assignServices(
    storeId: string,
    staffId: string,
    data: AssignServicesDto,
  ): Promise<Service[]> {
    const response = await axiosInstance.post<Service[]>(
      `/stores/${storeId}/staff/${staffId}/services`,
      data,
    );
    return response.data;
  }

  /**
   * Get staff member's assigned services
   */
  async getStaffServices(storeId: string, staffId: string): Promise<Service[]> {
    const response = await axiosInstance.get<Service[]>(
      `/stores/${storeId}/staff/${staffId}/services`,
    );
    return response.data;
  }

  /**
   * Remove a service from staff member
   */
  async removeServiceFromStaff(
    storeId: string,
    staffId: string,
    serviceId: string,
  ): Promise<void> {
    await axiosInstance.delete(
      `/stores/${storeId}/staff/${staffId}/services/${serviceId}`,
    );
  }

  // ============= Working Hours =============

  /**
   * Create working hours for a staff member
   */
  async createWorkingHours(
    storeId: string,
    staffId: string,
    data: CreateWorkingHoursDto,
  ): Promise<WorkingHours> {
    const response = await axiosInstance.post<WorkingHours>(
      `/stores/${storeId}/staff/${staffId}/working-hours`,
      data,
    );
    return response.data;
  }

  /**
   * Get staff member's working hours
   */
  async getWorkingHours(
    storeId: string,
    staffId: string,
  ): Promise<WorkingHours[]> {
    const response = await axiosInstance.get<WorkingHours[]>(
      `/stores/${storeId}/staff/${staffId}/working-hours`,
    );
    return response.data;
  }

  /**
   * Update working hours
   */
  async updateWorkingHours(
    storeId: string,
    staffId: string,
    workingHoursId: string,
    data: UpdateWorkingHoursDto,
  ): Promise<WorkingHours> {
    const response = await axiosInstance.patch<WorkingHours>(
      `/stores/${storeId}/staff/${staffId}/working-hours/${workingHoursId}`,
      data,
    );
    return response.data;
  }

  /**
   * Delete working hours
   */
  async deleteWorkingHours(
    storeId: string,
    staffId: string,
    workingHoursId: string,
  ): Promise<void> {
    await axiosInstance.delete(
      `/stores/${storeId}/staff/${staffId}/working-hours/${workingHoursId}`,
    );
  }

  // ============= Breaks & Time Off =============

  /**
   * Create a break/time off
   */
  async createStaffBreak(
    storeId: string,
    staffId: string,
    data: CreateStaffBreakDto,
  ): Promise<StaffBreak> {
    const response = await axiosInstance.post<StaffBreak>(
      `/stores/${storeId}/staff/${staffId}/breaks`,
      data,
    );
    return response.data;
  }

  /**
   * Get staff member's breaks
   */
  async getStaffBreaks(
    storeId: string,
    staffId: string,
  ): Promise<StaffBreak[]> {
    const response = await axiosInstance.get<StaffBreak[]>(
      `/stores/${storeId}/staff/${staffId}/breaks`,
    );
    return response.data;
  }

  /**
   * Update a break
   */
  async updateStaffBreak(
    storeId: string,
    staffId: string,
    breakId: string,
    data: UpdateStaffBreakDto,
  ): Promise<StaffBreak> {
    const response = await axiosInstance.patch<StaffBreak>(
      `/stores/${storeId}/staff/${staffId}/breaks/${breakId}`,
      data,
    );
    return response.data;
  }

  /**
   * Delete a break
   */
  async deleteStaffBreak(
    storeId: string,
    staffId: string,
    breakId: string,
  ): Promise<void> {
    await axiosInstance.delete(
      `/stores/${storeId}/staff/${staffId}/breaks/${breakId}`,
    );
  }
}

export const staffService = new StaffService();
