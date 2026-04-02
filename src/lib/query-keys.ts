export const storeScopedRoots = {
  appointments: "appointments",
  appointment: "appointment",
  recentAppointments: "recent-appointments",
  customers: "customers",
  customerFiles: "customer-files",
  categories: "categories",
  services: "services",
  locations: "locations",
  staff: "staff",
  staffDetails: "staff-details",
  staffServices: "staff-services",
  coupons: "coupons",
  feedbackDashboard: "feedback-dashboard",
  appointmentAnalytics: "appointmentAnalytics",
  revenueAnalytics: "revenueAnalytics",
  activities: "activities",
  adminActivities: "admin-activities",
  storeBreaks: "store-breaks",
} as const;

export type StoreScopedRoot =
  (typeof storeScopedRoots)[keyof typeof storeScopedRoots];

export function hasStoreScopedRoot(
  queryKey: readonly unknown[],
  root: StoreScopedRoot,
  storeId: string,
) {
  return queryKey[0] === root && queryKey[1] === storeId;
}

export function hasStoreEntityScopedRoot(
  queryKey: readonly unknown[],
  root: StoreScopedRoot,
  storeId: string,
  entityId: string,
  entityIndex = 2,
) {
  return (
    hasStoreScopedRoot(queryKey, root, storeId) &&
    queryKey[entityIndex] === entityId
  );
}

export const qk = {
  currentStore: ["my-store"] as const,

  appointments: (storeId?: string, ...rest: readonly unknown[]) =>
    ["appointments", storeId, ...rest] as const,
  appointment: (storeId?: string, appointmentId?: string) =>
    appointmentId
      ? (["appointment", storeId, appointmentId] as const)
      : (["appointment", storeId] as const),
  recentAppointments: (storeId?: string, ...rest: readonly unknown[]) =>
    ["recent-appointments", storeId, ...rest] as const,

  staff: (storeId?: string, ...rest: readonly unknown[]) =>
    ["staff", storeId, ...rest] as const,
  staffMembers: (storeId?: string, ...rest: readonly unknown[]) =>
    ["staff-members", storeId, ...rest] as const,
  myStaffMember: (storeId?: string, userId?: string) =>
    ["my-staff-member", storeId, userId] as const,
  staffMember: (storeId?: string, staffId?: string) =>
    ["staff-member", storeId, staffId] as const,
  staffDetails: (storeId?: string, staffId?: string) =>
    ["staff-details", storeId, staffId] as const,
  staffInvitations: (storeId?: string) =>
    ["staff-invitations", storeId] as const,
  staffAppointments: (storeId?: string, staffId?: string) =>
    ["staff-appointments", storeId, staffId] as const,
  staffBreaks: (storeId?: string, staffId?: string) =>
    ["staff-breaks", storeId, staffId] as const,
  storeBreaks: (storeId?: string, ...rest: readonly unknown[]) =>
    ["store-breaks", storeId, ...rest] as const,

  services: (storeId?: string) => ["services", storeId] as const,
  categories: (storeId?: string) => ["categories", storeId] as const,
  locations: (storeId?: string) => ["locations", storeId] as const,
  staffByService: (storeId?: string, serviceId?: string) =>
    ["staff-by-service", storeId, serviceId] as const,
  appointmentFormCustomers: (storeId?: string, search?: string) =>
    ["appointment-form-customers", storeId, search] as const,
  availability: (storeId?: string, ...rest: readonly unknown[]) =>
    ["availability", storeId, ...rest] as const,

  customers: (storeId?: string, ...rest: readonly unknown[]) =>
    ["customers", storeId, ...rest] as const,
  customerFiles: (
    storeId?: string,
    customerId?: string,
    ...rest: readonly unknown[]
  ) => ["customer-files", storeId, customerId, ...rest] as const,
  customerProfile: (storeId?: string, customerId?: string) =>
    ["customer-profile", storeId, customerId] as const,
  coupons: (storeId?: string) => ["coupons", storeId] as const,

  adminDashboard: (storeId?: string, locationId?: string) =>
    ["admin-dashboard", storeId, locationId] as const,
  activities: (storeId?: string, ...rest: readonly unknown[]) =>
    ["activities", storeId, ...rest] as const,
  adminActivities: (storeId?: string, ...rest: readonly unknown[]) =>
    ["admin-activities", storeId, ...rest] as const,

  notifications: (...rest: readonly unknown[]) =>
    ["notifications", ...rest] as const,
  notificationSettings: (storeId?: string) =>
    ["notificationSettings", storeId] as const,

  staffInvitation: (token?: string) => ["staff-invitation", token] as const,
  staffServices: (storeId?: string, staffId?: string) =>
    ["staff-services", storeId, staffId] as const,

  feedbackDashboard: (storeId?: string, ...rest: readonly unknown[]) =>
    ["feedback-dashboard", storeId, ...rest] as const,
  feedbackCheck: (storeId?: string, appointmentId?: string, token?: string) =>
    ["feedback-check", storeId, appointmentId, token] as const,

  widgetSettings: (storeId?: string) => ["widgetSettings", storeId] as const,
  widgetEmbedCode: (storeId?: string) => ["widgetEmbedCode", storeId] as const,
  widgetSecurityStatus: (storeId?: string) =>
    ["widgetSecurityStatus", storeId] as const,
  widgetEmbedBootstrap: (slug?: string) =>
    ["widgetEmbedBootstrap", slug] as const,
  publicWidgetConfig: (slug?: string, token?: string) =>
    ["publicWidgetConfig", slug, token] as const,
  publicLocations: (slug?: string, token?: string) =>
    ["publicLocations", slug, token] as const,
  publicFeedback: (storeId?: string) => ["publicFeedback", storeId] as const,

  billingConnectStatus: (storeId?: string) =>
    ["billing-connect-status", storeId] as const,

  appointmentAnalytics: (storeId?: string, dateRange?: string) =>
    dateRange
      ? (["appointmentAnalytics", storeId, dateRange] as const)
      : (["appointmentAnalytics", storeId] as const),
  revenueAnalytics: (storeId?: string, dateRange?: string) =>
    dateRange
      ? (["revenueAnalytics", storeId, dateRange] as const)
      : (["revenueAnalytics", storeId] as const),
};
