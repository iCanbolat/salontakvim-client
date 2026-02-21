/**
 * Shared React Query client
 */
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

queryClient.setQueryDefaults(["services"], {
  staleTime: Number.POSITIVE_INFINITY,
  gcTime: 60 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
});

queryClient.setQueryDefaults(["locations"], {
  staleTime: Number.POSITIVE_INFINITY,
  gcTime: 60 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
});

queryClient.setQueryDefaults(["staff-by-service"], {
  staleTime: Number.POSITIVE_INFINITY,
  gcTime: 60 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
});
