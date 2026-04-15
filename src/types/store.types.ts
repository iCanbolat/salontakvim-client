/**
 * Store Types
 * Matches backend store schema
 */

export type PaymentStatus = "trial" | "starter" | "pro" | "enterprise";
export type PaymentGateway = "creem" | "stripe" | "stripe_legacy";

export interface Store {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  email?: string;
  phone?: string;
  country: string;
  currency: string;
  paymentStatus: PaymentStatus;
  trialStartedAt: string;
  trialEndsAt: string;
  paymentGateway: PaymentGateway;
  creemCustomerId?: string;
  creemSubscriptionId?: string;
  creemSubscriptionStatus?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeSubscriptionStatus?: string;
  storeImages?: string[];
  totalAppointments: number;
  totalCustomers: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateStoreDto {
  name?: string;
  slug?: string;
  description?: string;
  logo?: string;
  email?: string;
  phone?: string;
  currency?: string;
}
