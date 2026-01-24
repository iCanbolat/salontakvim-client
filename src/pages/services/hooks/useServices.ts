/**
 * useServices Hook
 * Centralizes state and logic for the Services List page.
 */

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { storeService, serviceService } from "@/services";
import { usePagination } from "@/hooks";
import type { Service } from "@/types";

export function useServices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");

  // Fetch user's store
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
  });

  // Fetch services
  const {
    data: services,
    isLoading: servicesLoading,
    error,
  } = useQuery({
    queryKey: ["services", store?.id],
    queryFn: () => serviceService.getServices(store!.id),
    enabled: !!store?.id,
  });

  const isLoading = storeLoading || servicesLoading;

  // Filter services based on search
  const filteredServices = useMemo(() => {
    return (
      services?.filter(
        (service) =>
          service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()),
      ) || []
    );
  }, [services, searchQuery]);

  // Pagination
  const pagination = usePagination({
    items: filteredServices,
    itemsPerPage: 12, // Increased from 6 for better UX
  });

  // Reset to first page on search
  useEffect(() => {
    pagination.goToPage(1);
  }, [searchQuery]);

  const handleEdit = (service: Service) => {
    setEditingService(service);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingService(null);
  };

  return {
    state: {
      searchQuery,
      isCreateDialogOpen,
      editingService,
      view,
      isLoading,
      error,
    },
    actions: {
      setSearchQuery,
      setIsCreateDialogOpen,
      setEditingService,
      setView,
      handleEdit,
      handleCloseDialog,
      goToPage: pagination.goToPage,
    },
    data: {
      store,
      services: filteredServices,
      paginatedServices: pagination.paginatedItems,
      totalCount: filteredServices.length,
    },
    pagination: {
      currentPage: pagination.currentPage,
      totalPages: pagination.totalPages,
      startIndex: pagination.startIndex,
      endIndex: pagination.endIndex,
    },
  };
}
