/**
 * useCustomers Hook
 * Centralizes state and logic for the Customers List page.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { storeService, customerService } from "@/services";
import { useDebouncedSearch, usePagination } from "@/hooks";
import { useAuth } from "@/contexts";
import type { CustomerWithStats } from "@/types";

export type CustomerView = "grid" | "list";

export function useCustomers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // UI State
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1", 10),
  );
  const [view, setView] = useState<CustomerView>("grid");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isSmsDialogOpen, setIsSmsDialogOpen] = useState(false);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const itemsPerPage = 12;

  const basePath = "/customers";

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
    data: customerResponse,
    isPending: customersPending,
    error,
  } = useQuery({
    queryKey: [
      "customers",
      store?.id,
      debouncedSearch,
      currentPage,
      user?.role,
      user?.id,
      user?.locationId,
    ],
    queryFn: () =>
      customerService.getCustomers(store!.id, {
        search: debouncedSearch || undefined,
        page: currentPage,
        limit: itemsPerPage,
      }),
    enabled: !!store?.id,
    placeholderData: keepPreviousData,
  });

  // Pagination
  const {
    paginatedItems: customers,
    totalPages,
    goToPage,
    startIndex,
    endIndex,
  } = usePagination({
    items: customerResponse?.data || [],
    itemsPerPage,
    totalItems: customerResponse?.total ?? 0,
    currentPage,
    onPageChange: setCurrentPage,
    disableSlice: true,
  });

  const isInitialLoading =
    (storeLoading || customersPending) && !customerResponse;

  // URL Sync
  useEffect(() => {
    const current = new URLSearchParams(searchParams);
    if (searchTerm) {
      current.set("search", searchTerm);
    } else {
      current.delete("search");
    }

    if (currentPage > 1) {
      current.set("page", currentPage.toString());
    } else {
      current.delete("page");
    }

    const nextSearch = current.toString();
    const prevSearch = searchParams.toString();

    if (nextSearch !== prevSearch) {
      setSearchParams(current, { replace: true });
    }
  }, [searchTerm, currentPage, setSearchParams, searchParams]);

  // Reset pagination on search
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Derived
  const isAllCustomersSelected =
    customerResponse?.data &&
    customerResponse.data.length > 0 &&
    selectedCustomers.length === customerResponse.total;

  const selectedCustomersData = useMemo(
    () =>
      customerResponse?.data
        ? customerResponse.data.filter((c) => selectedCustomers.includes(c.id))
        : [],
    [customerResponse?.data, selectedCustomers],
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
    if (!customerResponse) return;
    setSelectedCustomers(customerResponse.data.map((c) => c.id));
  }, [customerResponse]);

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
      totalCount: customerResponse?.total ?? 0,
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
