/**
 * useCustomers Hook
 * Centralizes state and logic for the Customers List page.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { storeService, customerService } from "@/services";
import { useDebouncedSearch, usePagination } from "@/hooks";
import type { CustomerWithStats } from "@/types";

export type CustomerView = "grid" | "list";

export function useCustomers() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<CustomerView>("grid");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isSmsDialogOpen, setIsSmsDialogOpen] = useState(false);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState(false);

  // Determine base path (admin or staff)
  const basePath = location.pathname.startsWith("/staff")
    ? "/staff/customers"
    : "/admin/customers";

  const debouncedSearch = useDebouncedSearch(searchTerm, {
    minLength: 2,
    delay: 400,
  });

  // Fetch store
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
  });

  // Fetch customers
  const {
    data: allCustomers,
    isPending: customersPending,
    error,
  } = useQuery({
    queryKey: ["customers", store?.id, debouncedSearch],
    queryFn: () =>
      customerService.getCustomers(store!.id, {
        search: debouncedSearch || undefined,
      }),
    enabled: !!store?.id,
    placeholderData: keepPreviousData,
  });

  // Pagination
  const {
    paginatedItems: customers,
    currentPage,
    totalPages,
    goToPage,
    startIndex,
    endIndex,
  } = usePagination({
    items: allCustomers || [],
    itemsPerPage: 12,
  });

  const isInitialLoading = (storeLoading || customersPending) && !allCustomers;

  // URL Sync
  useEffect(() => {
    const initialSearch = searchParams.get("search");
    if (initialSearch && initialSearch !== searchTerm) {
      setSearchTerm(initialSearch);
    }
  }, [searchParams]);

  useEffect(() => {
    const current = new URLSearchParams(searchParams);
    if (searchTerm) {
      current.set("search", searchTerm);
    } else {
      current.delete("search");
    }
    const nextSearch = current.toString();
    const prevSearch = searchParams.toString();

    if (nextSearch !== prevSearch) {
      setSearchParams(current, { replace: true });
    }
  }, [searchTerm, setSearchParams, searchParams]);

  // Reset pagination on search
  useEffect(() => {
    goToPage(1);
  }, [debouncedSearch]);

  // Derived
  const isAllCustomersSelected =
    allCustomers &&
    allCustomers.length > 0 &&
    selectedCustomers.length === allCustomers.length;

  const selectedCustomersData = useMemo(
    () =>
      allCustomers
        ? allCustomers.filter((c) => selectedCustomers.includes(c.id))
        : [],
    [allCustomers, selectedCustomers],
  );

  // Actions
  const handleViewCustomer = useCallback(
    (customer: CustomerWithStats) => {
      navigate(`${basePath}/${customer.id}`);
    },
    [navigate, basePath],
  );

  const handleSelectCustomer = useCallback(
    (customerId: string, checked: boolean) => {
      setSelectedCustomers((prev) =>
        checked
          ? [...prev, customerId]
          : prev.filter((id) => id !== customerId),
      );
    },
    [],
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedCustomers((prev) => {
        if (checked) {
          const pageIds = customers.map((c) => c.id);
          const uniqueIds = Array.from(new Set([...prev, ...pageIds]));
          return uniqueIds;
        }
        const pageIds = new Set(customers.map((c) => c.id));
        return prev.filter((id) => !pageIds.has(id));
      });
    },
    [customers],
  );

  const handleSelectAllInTotal = useCallback(() => {
    if (!allCustomers) return;
    setSelectedCustomers(allCustomers.map((c) => c.id));
  }, [allCustomers]);

  const handleSendSms = async (message: string) => {
    setIsSendingSms(true);
    try {
      // API call placeholder
      console.log("Sending SMS...", { selectedCustomers, message });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSelectedCustomers([]);
      setIsSmsDialogOpen(false);
    } catch (err) {
      console.error("SMS failed", err);
    } finally {
      setIsSendingSms(false);
    }
  };

  return {
    store,
    state: {
      searchTerm,
      view,
      selectedCustomers,
      isSmsDialogOpen,
      isDiscountDialogOpen,
      isSendingSms,
      currentPage,
      totalPages,
      startIndex,
      endIndex,
      isInitialLoading,
      error,
      isAllCustomersSelected,
    },
    data: {
      customers,
      totalCount: allCustomers?.length ?? 0,
      selectedCustomersData,
    },
    actions: {
      setSearchTerm,
      setView,
      setIsSmsDialogOpen,
      setIsDiscountDialogOpen,
      goToPage,
      handleViewCustomer,
      handleSelectCustomer,
      handleSelectAll,
      handleSelectAllInTotal,
      handleSendSms,
      setSelectedCustomers,
    },
  };
}
