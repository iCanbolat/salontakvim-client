/**
 * Analytics Types
 * Matches backend analytics DTOs
 */

export interface DashboardStats {
  totalAppointments: number;
  totalRevenue: string;
  totalCustomers: number;
  totalStaff: number;
  appointmentsToday: number;
  appointmentsTomorrow: number;
  revenueToday: string;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  expiredAppointments: number;
  cancellationRate: string;
  averageAppointmentValue: string;
  popularTimeSlot: string;
}

export interface RecentActivity {
  id: number;
  storeId: number;
  type: "appointment" | "customer" | "staff";
  message: string;
  metadata?: any;
  createdAt: string;
}

export interface DashboardResponse {
  stats: DashboardStats;
  recentActivity: RecentActivity[];
  calculatedAt: string;
}

// Analytics Query Parameters
export const DateRangePreset = {
  TODAY: "today",
  YESTERDAY: "yesterday",
  LAST_7_DAYS: "last_7_days",
  LAST_30_DAYS: "last_30_days",
  THIS_MONTH: "this_month",
  LAST_MONTH: "last_month",
  THIS_YEAR: "this_year",
  CUSTOM: "custom",
} as const;

export type DateRangePreset =
  (typeof DateRangePreset)[keyof typeof DateRangePreset];

export const GroupBy = {
  DAY: "day",
  WEEK: "week",
  MONTH: "month",
  YEAR: "year",
} as const;

export type GroupBy = (typeof GroupBy)[keyof typeof GroupBy];

export interface AnalyticsQuery {
  dateRange?: DateRangePreset;
  startDate?: string;
  endDate?: string;
  serviceId?: number;
  staffId?: number;
  locationId?: number;
  categoryId?: number;
  groupBy?: GroupBy;
  limit?: number;
}

// Appointment Analytics
export interface AppointmentByStatus {
  status: string;
  count: number;
  percentage: string;
}

export interface AppointmentByDate {
  date: string;
  count: number;
  revenue: string;
}

export interface AppointmentByTimeSlot {
  timeSlot: string;
  count: number;
  percentage: string;
}

export interface AppointmentByService {
  serviceId: number;
  serviceName: string;
  count: number;
  revenue: string;
  percentage: string;
}

export interface AppointmentByStaff {
  staffId: number;
  staffName: string;
  count: number;
  revenue: string;
  percentage: string;
}

export interface AppointmentAnalyticsResponse {
  totalAppointments: number;
  totalRevenue: string;
  averageAppointmentValue: string;
  byStatus: AppointmentByStatus[];
  byDate: AppointmentByDate[];
  byTimeSlot: AppointmentByTimeSlot[];
  byService: AppointmentByService[];
  byStaff: AppointmentByStaff[];
  startDate: string;
  endDate: string;
  calculatedAt: string;
}

// Revenue Analytics
export interface RevenueByDate {
  date: string;
  revenue: string;
  appointmentCount: number;
  averageValue: string;
}

export interface RevenueByService {
  serviceId: number;
  serviceName: string;
  revenue: string;
  appointmentCount: number;
  percentage: string;
}

export interface RevenueByStaff {
  staffId: number;
  staffName: string;
  revenue: string;
  appointmentCount: number;
  percentage: string;
}

export interface RevenueByPaymentMethod {
  paymentMethod: string;
  revenue: string;
  appointmentCount: number;
  percentage: string;
}

export interface RevenueSummary {
  totalRevenue: string;
  averageAppointmentValue: string;
  totalAppointments: number;
  paidAppointments: number;
  unpaidAppointments: number;
  collectionRate: string;
}

export interface RevenueAnalyticsResponse {
  summary: RevenueSummary;
  byDate: RevenueByDate[];
  byService: RevenueByService[];
  byStaff: RevenueByStaff[];
  byPaymentMethod: RevenueByPaymentMethod[];
  startDate: string;
  endDate: string;
  calculatedAt: string;
}
