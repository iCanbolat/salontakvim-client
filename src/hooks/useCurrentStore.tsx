import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts";
import { storeService, authService } from "@/services";
import { useCurrentStoreState } from "@/stores/currentStore.store";
import { qk } from "@/lib/query-keys";

export function useCurrentStore() {
  const store = useCurrentStoreState((state) => state.store);
  const isLoading = useCurrentStoreState((state) => state.isLoading);
  const hasInitialized = useCurrentStoreState((state) => state.hasInitialized);

  return {
    store,
    isLoading,
    hasInitialized,
  };
}

export function useCurrentStoreBootstrap() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const setStore = useCurrentStoreState((state) => state.setStore);
  const setLoading = useCurrentStoreState((state) => state.setLoading);
  const setHasInitialized = useCurrentStoreState(
    (state) => state.setHasInitialized,
  );
  const trialExpiryTimerRef = useRef<number | null>(null);

  const shouldFetchStore =
    !authLoading && !!user && isAuthenticated && !authService.needsOnboarding();

  const query = useQuery({
    queryKey: qk.currentStore,
    queryFn: () => storeService.getMyStore(),
    enabled: shouldFetchStore,
  });

  useEffect(() => {
    return () => {
      if (
        trialExpiryTimerRef.current !== null &&
        typeof window !== "undefined"
      ) {
        window.clearTimeout(trialExpiryTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (trialExpiryTimerRef.current !== null && typeof window !== "undefined") {
      window.clearTimeout(trialExpiryTimerRef.current);
      trialExpiryTimerRef.current = null;
    }

    if (!query.data || !isAuthenticated || !user) {
      return;
    }

    if (user.role !== "admin") {
      authService.clearSubscriptionState();
      return;
    }

    const forceTrialLogout = async () => {
      try {
        await logout();
      } finally {
        if (typeof window !== "undefined") {
          window.location.href = "/login?reason=trial-expired";
        }
      }
    };

    if (query.data.paymentStatus !== "trial" || !query.data.trialEndsAt) {
      authService.clearSubscriptionState();
      return;
    }

    const trialEndsAtMs = new Date(query.data.trialEndsAt).getTime();
    if (!Number.isFinite(trialEndsAtMs)) {
      return;
    }

    const isExpired = trialEndsAtMs <= Date.now();

    if (isExpired) {
      if (!authService.requiresSubscription()) {
        void forceTrialLogout();
      }
      return;
    }

    authService.clearSubscriptionState();

    if (typeof window !== "undefined") {
      trialExpiryTimerRef.current = window.setTimeout(
        () => {
          void forceTrialLogout();
        },
        Math.max(0, trialEndsAtMs - Date.now()),
      );
    }
  }, [query.data, isAuthenticated, user, logout]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setStore(null);
      setLoading(false);
      setHasInitialized(false);
      return;
    }

    if (!shouldFetchStore) {
      setLoading(false);
      setHasInitialized(true);
      return;
    }

    setLoading(query.isLoading);
  }, [
    isAuthenticated,
    user,
    shouldFetchStore,
    query.isLoading,
    setStore,
    setLoading,
    setHasInitialized,
  ]);

  useEffect(() => {
    if (query.data) {
      setStore(query.data);
      setHasInitialized(true);
    }
  }, [query.data, setStore, setHasInitialized]);

  useEffect(() => {
    if (query.error) {
      setStore(null);
      setHasInitialized(true);
    }
  }, [query.error, setStore, setHasInitialized]);

  return query;
}

export function CurrentStoreBootstrap() {
  useCurrentStoreBootstrap();
  return null;
}
