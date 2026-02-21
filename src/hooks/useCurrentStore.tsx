import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts";
import { storeService, authService } from "@/services";
import { useCurrentStoreState } from "@/stores/currentStore.store";

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
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const setStore = useCurrentStoreState((state) => state.setStore);
  const setLoading = useCurrentStoreState((state) => state.setLoading);
  const setHasInitialized = useCurrentStoreState(
    (state) => state.setHasInitialized,
  );

  const shouldFetchStore =
    !authLoading && !!user && isAuthenticated && !authService.needsOnboarding();

  const query = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
    enabled: shouldFetchStore,
  });

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
