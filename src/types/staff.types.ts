/**
 * Staff Types
 * Matches backend staff schema
 */

export interface StaffMember {
  id: number;
  userId: number;
  storeId: number;
  locationId?: number;
  locationName?: string | null;
  bio?: string;
  title?: string;
  fullName?: string | null;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  // User info (from join)
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface StaffInvitation {
  id: number;
  storeId: number;
  email: string;
  token: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
  invitedBy?: number;
  locationId?: number | null;
  locationName?: string | null;
  title?: string | null;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
}

export interface InviteStaffDto {
  email: string;
  title?: string;
  locationId?: number;
}

export interface AcceptStaffInvitationDto {
  firstName: string;
  lastName: string;
  phone?: string;
  password: string;
}

export interface StaffInvitationDetails {
  id: number;
  email: string;
  storeId: number;
  storeName: string | null;
  locationId: number | null;
  locationName: string | null;
  title: string | null;
  status: "pending" | "accepted" | "expired" | "cancelled";
  expiresAt: string;
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
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkingHoursDto {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

export interface UpdateWorkingHoursDto {
  dayOfWeek?: DayOfWeek;
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
