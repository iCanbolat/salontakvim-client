import { axiosInstance } from "./api-client";

export interface CreateSubscriptionCheckoutDto {
  storeId: string;
  successUrl: string;
  cancelUrl: string;
  plan?: "pro" | "business";
}

export interface SubscriptionCheckoutResponse {
  checkoutUrl: string | null;
  sessionId: string;
}

export interface CreateConnectOnboardingDto {
  storeId: string;
  refreshUrl: string;
  returnUrl: string;
}

export interface ConnectOnboardingResponse {
  accountId: string;
  onboardingUrl: string;
  expiresAt: number;
}

export interface ConnectStatusResponse {
  hasAccount: boolean;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  accountId?: string;
}

export class BillingService {
  async createSubscriptionCheckoutSession(
    data: CreateSubscriptionCheckoutDto,
  ): Promise<SubscriptionCheckoutResponse> {
    const response = await axiosInstance.post<SubscriptionCheckoutResponse>(
      "/billing/subscriptions/checkout-session",
      data,
    );
    return response.data;
  }

  async createConnectOnboardingLink(
    data: CreateConnectOnboardingDto,
  ): Promise<ConnectOnboardingResponse> {
    const response = await axiosInstance.post<ConnectOnboardingResponse>(
      "/billing/connect/onboarding-link",
      data,
    );
    return response.data;
  }

  async getConnectStatus(storeId: string): Promise<ConnectStatusResponse> {
    const response = await axiosInstance.get<ConnectStatusResponse>(
      `/billing/connect/status/${storeId}`,
    );
    return response.data;
  }
}

export const billingService = new BillingService();
