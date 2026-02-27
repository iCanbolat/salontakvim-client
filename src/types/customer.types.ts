/**
 * Customer Types
 * Customer-specific types and interfaces
 */

import type { User } from "./user.types";
import type { Appointment } from "./appointment.types";

/**
 * Customer extends User with role='customer'
 */
export interface Customer extends User {
  role: "customer";
  publicNumber?: string;
}

/**
 * Customer with appointment statistics
 */
export interface CustomerWithStats extends Customer {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalSpent: string;
  lastAppointmentDate?: string;
  nextAppointmentDate?: string;
}

/**
 * Customer profile with full details
 */
export interface CustomerProfile {
  customer: CustomerWithStats;
  appointments: Appointment[];
  smsHistory?: CustomerSmsHistoryItem[];
  notes?: CustomerNote[];
  tags?: string[];
}

export interface CustomerSmsHistoryItem {
  id: string;
  message: string;
  createdAt: string;
  metadata?: {
    action?: "sms_sent" | "sms_failed";
    reason?: "no_phone" | "invalid_phone";
    isBulk?: boolean;
    senderRole?: string;
    preview?: string;
    [key: string]: unknown;
  };
}

/**
 * Customer note
 */
export interface CustomerNote {
  id: string;
  customerId: string;
  storeId: string;
  note: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Customer filters for search and filtering
 */
export interface CustomerFilters {
  search?: string; // Search by name, email, phone
  hasAppointments?: boolean;
  minSpent?: number;
  maxSpent?: number;
  registeredAfter?: string;
  registeredBefore?: string;
  lastAppointmentAfter?: string;
  lastAppointmentBefore?: string;
  sortBy?: "name" | "email" | "totalSpent" | "lastAppointment" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

/**
 * Update customer DTO
 */
export interface UpdateCustomerDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

/**
 * Customer statistics response
 */
export interface CustomerStats {
  totalCustomers: number;
  newCustomersThisMonth: number;
  activeCustomers: number; // Customers with appointments in last 30 days
  totalRevenue: string;
  averageSpentPerCustomer: string;
}

export interface SendBulkSmsDto {
  customerIds: string[];
  message: string;
}

export interface BulkSmsResult {
  requested: number;
  eligible: number;
  sent: number;
  failed: number;
  noPhone: number;
  message: string;
}
