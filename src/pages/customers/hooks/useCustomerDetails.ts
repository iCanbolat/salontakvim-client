/**
 * useCustomerDetails Hook
 * Centralizes state and logic for the Customer Details page.
 */

import { useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { storeService, customerService } from "@/services";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";

// UUID v4 regex pattern
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useCustomerDetails() {
  const { customerId } = useParams<{ customerId: string }>();
  const location = useLocation();
  const { setBreadcrumbLabel, clearBreadcrumbLabel } = useBreadcrumb();

  const isValidCustomerId = !!customerId && UUID_REGEX.test(customerId);

  // Fetch store
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
  });

  // Fetch customer profile
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ["customer-profile", store?.id, customerId],
    queryFn: () => customerService.getCustomerProfile(store!.id, customerId!),
    enabled: !!store?.id && isValidCustomerId,
    retry: 1,
  });

  // Update breadcrumb
  useEffect(() => {
    if (profile?.customer) {
      const customerName =
        `${profile.customer.firstName || ""} ${
          profile.customer.lastName || ""
        }`.trim() || "Unnamed Customer";
      setBreadcrumbLabel(location.pathname, customerName);
    }

    return () => {
      clearBreadcrumbLabel(location.pathname);
    };
  }, [profile, location.pathname, setBreadcrumbLabel, clearBreadcrumbLabel]);

  return {
    customerId,
    store,
    profile,
    isLoading: storeLoading || profileLoading,
    profileError,
    isValidCustomerId,
  };
}
