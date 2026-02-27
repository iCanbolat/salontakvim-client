import type { QueryClient } from "@tanstack/react-query";

interface InvalidateCustomerFileDomainOptions {
  storeId: string;
  customerId: string;
  appointmentId?: string;
}

export function invalidateCustomerFileDomain(
  queryClient: QueryClient,
  options: InvalidateCustomerFileDomainOptions,
) {
  const { storeId, customerId, appointmentId } = options;

  queryClient.invalidateQueries({
    queryKey: ["customer-files", storeId, customerId],
  });

  if (appointmentId) {
    queryClient.invalidateQueries({
      queryKey: ["appointment", storeId, appointmentId],
    });
  }
}
