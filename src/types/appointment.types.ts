/**
 * Appointment Types
 * Matches backend appointment DTOs
 */

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "expired"
  | "no_show";

export interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface AppointmentExtra {
  id: string;
  extraId: string;
  quantity: number;
  price: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  storeId: string;
  customerId?: string;
  customerName?: string;
  customerNumber?: number; // For easy customer search
  serviceId?: string;
  serviceName?: string;
  staffId?: string;
  staffName?: string;
  locationId?: string;
  locationName?: string;
  storeName?: string;
  guestInfo?: GuestInfo;
  startDateTime: string;
  endDateTime: string;
  numberOfPeople: number;
  status: AppointmentStatus;
  totalPrice: string;
  depositAmount?: string;
  remainingAmount?: string;
  paymentMethod?: string;
  isPaid: boolean;
  paidAt?: string;
  feedback?: any;
  files?: any[];
  customerNotes?: string;
  internalNotes?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  isRecurring: boolean;
  parentAppointmentId?: string;
  publicNumber?: string; // For easy appointment search
  extras?: AppointmentExtra[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentDto {
  customerId?: string;
  serviceId?: string;
  staffId?: string;
  locationId?: string;
  guestFirstName?: string;
  guestLastName?: string;
  guestEmail?: string;
  guestPhone?: string;
  startDateTime: string;
  numberOfPeople: number;
  customerNotes?: string;
  extras?: Array<{
    extraId: string;
    quantity: number;
  }>;
}

export interface UpdateAppointmentDto {
  serviceId?: string;
  staffId?: string;
  locationId?: string;
  startDateTime?: string;
  numberOfPeople?: number;
  status?: AppointmentStatus;
  customerNotes?: string;
  internalNotes?: string;
  isPaid?: boolean;
  paymentMethod?: string;
}

export interface UpdateAppointmentStatusDto {
  status: AppointmentStatus;
  cancellationReason?: string;
  internalNotes?: string;
}

export interface SettleAppointmentPaymentDto {
  finalTotalPrice: number;
  paymentMethod?: "cash" | "card" | "online" | "stripe" | "paypal";
  markAsPaid?: boolean;
  internalNotes?: string;
}

export interface AppointmentFilters {
  startDate?: string;
  endDate?: string;
  status?: AppointmentStatus;
  serviceId?: string;
  staffId?: string;
  staffIds?: string[];
  locationId?: string;
  customerId?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface AppointmentStatusCounts {
  all: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  no_show: number;
  expired: number;
}

export interface PaginatedAppointmentsResponse {
  data: Appointment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  statusCounts: AppointmentStatusCounts;
}

export interface AvailabilityTimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  reason?: string;
}

export interface AvailabilityResponse {
  date: string;
  serviceId: string;
  staffId: string;
  locationId?: string;
  slots: AvailabilityTimeSlot[];
}
