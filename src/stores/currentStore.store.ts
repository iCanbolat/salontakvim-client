import { create } from "zustand";
import type { Store } from "@/types";

interface CurrentStoreState {
  store: Store | null;
  isLoading: boolean;
  hasInitialized: boolean;
  setStore: (store: Store | null) => void;
  setLoading: (isLoading: boolean) => void;
  setHasInitialized: (hasInitialized: boolean) => void;
  reset: () => void;
}

const initialState = {
  store: null,
  isLoading: false,
  hasInitialized: false,
};

export const useCurrentStoreState = create<CurrentStoreState>((set) => ({
  ...initialState,
  setStore: (store) => set({ store }),
  setLoading: (isLoading) => set({ isLoading }),
  setHasInitialized: (hasInitialized) => set({ hasInitialized }),
  reset: () => set(initialState),
}));

export function resetCurrentStoreState() {
  useCurrentStoreState.getState().reset();
}
