import { axiosInstance } from "./api-client";

export interface CreateSubscriptionCheckoutDto {
  storeId: string;
  successUrl: string;
  cancelUrl: string;
  plan?: "starter" | "pro" | "enterprise";
  billingCycle?: "monthly" | "annual";
}

export interface SubscriptionCheckoutResponse {
  checkoutUrl: string | null;
  sessionId: string;
  gateway?: "creem" | "stripe" | "stripe_legacy";
}

export type ConnectStatusSource = "creem_api" | "creem_dashboard_manual";

export interface CreateConnectOnboardingDto {
  storeId: string;
  refreshUrl: string;
  returnUrl: string;
}

export interface ConnectOnboardingResponse {
  accountId: string;
  onboardingUrl: string;
  expiresAt: number;
  provider?: "creem";
  statusSource?: ConnectStatusSource;
  onboardingComplete?: boolean;
}

export interface ConnectStatusResponse {
  hasAccount: boolean;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  accountId?: string;
  provider?: "creem";
  statusSource?: ConnectStatusSource;
}

export interface UpdateConnectStatusDto {
  onboardingComplete: boolean;
  accountId?: string;
}

export interface StorePayout {
  id: string;
  transactionId: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

export type StorePayoutStatusFilter = "all" | "pending" | "paid";

export interface GetStorePayoutsParams {
  status?: StorePayoutStatusFilter;
  page?: number;
  limit?: number;
}

export interface StorePayoutsResponse {
  payouts: StorePayout[];
  summary: {
    pendingCount: number;
    paidCount: number;
    pendingNetAmount: number;
    paidNetAmount: number;
    currency: string | null;
  };
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  statusFilter: StorePayoutStatusFilter;
}

export interface MarkStorePayoutPaidResponse {
  payout: StorePayout;
  wasAlreadyPaid: boolean;
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

  async updateConnectStatus(
    storeId: string,
    data: UpdateConnectStatusDto,
  ): Promise<ConnectStatusResponse> {
    const response = await axiosInstance.patch<ConnectStatusResponse>(
      `/billing/connect/status/${storeId}`,
      data,
    );
    return response.data;
  }

  async getStorePayouts(
    storeId: string,
    params?: GetStorePayoutsParams,
  ): Promise<StorePayoutsResponse> {
    const queryParams: Record<string, string | number> = {};

    if (params?.status && params.status !== "all") {
      queryParams.status = params.status;
    }

    if (typeof params?.page === "number") {
      queryParams.page = params.page;
    }

    if (typeof params?.limit === "number") {
      queryParams.limit = params.limit;
    }

    const response = await axiosInstance.get<StorePayoutsResponse>(
      `/billing/stores/${storeId}/payouts`,
      {
        params: queryParams,
      },
    );
    return response.data;
  }

  async markStorePayoutPaid(
    storeId: string,
    payoutId: string,
  ): Promise<MarkStorePayoutPaidResponse> {
    const response = await axiosInstance.patch<MarkStorePayoutPaidResponse>(
      `/billing/stores/${storeId}/payouts/${payoutId}/mark-paid`,
    );

    return response.data;
  }
}

export const billingService = new BillingService();
