/**
 * Staff Types
 * Matches backend staff schema
 */

export interface StaffMember {
  id: string;
  userId: string;
  storeId: string;
  locationId?: string;
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
  id: string;
  storeId: string;
  email: string;
  token: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
  invitedBy?: string;
  locationId?: string | null;
  locationName?: string | null;
  title?: string | null;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
}

export interface InviteStaffDto {
  email: string;
  title?: string;
  locationId?: string;
}

export interface AcceptStaffInvitationDto {
  firstName: string;
  lastName: string;
  phone?: string;
  password: string;
}

export interface StaffInvitationDetails {
  id: string;
  email: string;
  storeId: string;
  storeName: string | null;
  locationId: string | null;
  locationName: string | null;
  title: string | null;
  status: "pending" | "accepted" | "expired" | "cancelled";
  expiresAt: string;
}

export interface UpdateStaffProfileDto {
  bio?: string;
  title?: string;
  locationId?: string;
  isVisible?: boolean;
}

export interface AssignServicesDto {
  serviceIds: string[];
}

export interface WorkingHours {
  id: string;
  staffId: string;
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
  id: string;
  staffId: string;
  type?: StaffBreakType;
  status: StaffBreakStatus;
  startDate: string;
  endDate: string;
  startTime?: string; // For partial day breaks
  endTime?: string; // For partial day breaks
  reason?: string;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaffBreakWithStaff extends StaffBreak {
  staffFirstName?: string | null;
  staffLastName?: string | null;
  staffEmail?: string | null;
  staffTitle?: string | null;
}

export interface CreateStaffBreakDto {
  type?: StaffBreakType;
  status?: StaffBreakStatus;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
  isRecurring?: boolean;
}

export interface UpdateStaffBreakDto {
  type?: StaffBreakType;
  status?: StaffBreakStatus;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
  isRecurring?: boolean;
}

export type StaffBreakStatus = "pending" | "approved" | "declined";

export type StaffBreakType =
  | "paid_leave"
  | "sick_leave"
  | "unpaid_leave"
  | "break"
  | "other";
