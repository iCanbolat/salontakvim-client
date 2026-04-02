import type { QueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";

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
    queryKey: qk.customerFiles(storeId, customerId),
  });

  if (appointmentId) {
    queryClient.invalidateQueries({
      queryKey: qk.appointment(storeId, appointmentId),
    });
  }
}
