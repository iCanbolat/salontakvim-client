/**
 * Breadcrumb Context
 * Provides dynamic breadcrumb labels for pages
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

interface BreadcrumbContextValue {
  overrides: Record<string, string>;
  setBreadcrumbLabel: (path: string, label: string) => void;
  clearBreadcrumbLabel: (path: string) => void;
  clearAllBreadcrumbs: () => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | undefined>(
  undefined
);

interface BreadcrumbProviderProps {
  children: ReactNode;
}

export function BreadcrumbProvider({ children }: BreadcrumbProviderProps) {
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const setBreadcrumbLabel = useCallback((path: string, label: string) => {
    setOverrides((prev) => ({ ...prev, [path]: label }));
  }, []);

  const clearBreadcrumbLabel = useCallback((path: string) => {
    setOverrides((prev) => {
      const newOverrides = { ...prev };
      delete newOverrides[path];
      return newOverrides;
    });
  }, []);

  const clearAllBreadcrumbs = useCallback(() => {
    setOverrides({});
  }, []);

  const value = useMemo(
    () => ({
      overrides,
      setBreadcrumbLabel,
      clearBreadcrumbLabel,
      clearAllBreadcrumbs,
    }),
    [overrides, setBreadcrumbLabel, clearBreadcrumbLabel, clearAllBreadcrumbs]
  );

  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error("useBreadcrumb must be used within BreadcrumbProvider");
  }
  return context;
}
