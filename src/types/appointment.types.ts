/**
 * Appointment Types
 * Matches backend appointment DTOs
 */

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface AppointmentExtra {
  id: number;
  extraId: number;
  quantity: number;
  price: string;
  createdAt: string;
}

export interface Appointment {
  id: number;
  storeId: number;
  customerId?: number;
  customerName?: string;
  serviceId?: number;
  serviceName?: string;
  staffId?: number;
  staffName?: string;
  locationId?: number;
  locationName?: string;
  guestInfo?: GuestInfo;
  startDateTime: string;
  endDateTime: string;
  numberOfPeople: number;
  status: AppointmentStatus;
  totalPrice: string;
  paymentMethod?: string;
  isPaid: boolean;
  paidAt?: string;
  customerNotes?: string;
  internalNotes?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  isRecurring: boolean;
  parentAppointmentId?: number;
  extras?: AppointmentExtra[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentDto {
  customerId?: number;
  serviceId?: number;
  staffId?: number;
  locationId?: number;
  guestFirstName?: string;
  guestLastName?: string;
  guestEmail?: string;
  guestPhone?: string;
  startDateTime: string;
  numberOfPeople: number;
  customerNotes?: string;
  extras?: Array<{
    extraId: number;
    quantity: number;
  }>;
}

export interface UpdateAppointmentDto {
  serviceId?: number;
  staffId?: number;
  locationId?: number;
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

export interface AppointmentFilters {
  startDate?: string;
  endDate?: string;
  status?: AppointmentStatus;
  serviceId?: number;
  staffId?: number;
  locationId?: number;
  customerId?: number;
  page?: number;
  limit?: number;
}
