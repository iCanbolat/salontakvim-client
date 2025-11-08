/**
 * Staff Types
 * Matches backend staff schema
 */

export interface StaffMember {
  id: number;
  userId: number;
  storeId: number;
  locationId?: number;
  bio?: string;
  title?: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  // User info (from join)
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface StaffInvitation {
  id: number;
  storeId: number;
  email: string;
  token: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
  invitedBy?: number;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
}

export interface InviteStaffDto {
  email: string;
}

export interface UpdateStaffProfileDto {
  bio?: string;
  title?: string;
  locationId?: number;
  isVisible?: boolean;
}

export interface AssignServicesDto {
  serviceIds: number[];
}

export interface WorkingHours {
  id: number;
  staffId: number;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkingHoursDto {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

export interface UpdateWorkingHoursDto {
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
}

export interface StaffBreak {
  id: number;
  staffId: number;
  startDate: string;
  endDate: string;
  startTime?: string; // For partial day breaks
  endTime?: string; // For partial day breaks
  reason?: string;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffBreakDto {
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
  isRecurring?: boolean;
}

export interface UpdateStaffBreakDto {
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
  isRecurring?: boolean;
}
