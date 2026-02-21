/**
 * useServices Hook
 * Centralizes state and logic for the Services List page.
 */

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { serviceService } from "@/services";
import { usePagination, useCurrentStore } from "@/hooks";
import type { Service } from "@/types";
import { toast } from "sonner";

export function useServices() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const { store, isLoading: storeLoading } = useCurrentStore();

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

  // Toggle visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: ({
      serviceId,
      isVisible,
    }: {
      serviceId: string;
      isVisible: boolean;
    }) => serviceService.updateService(store!.id, serviceId, { isVisible }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", store?.id] });
      toast.success("Service visibility updated");
    },
    onError: () => {
      toast.error("Failed to update service visibility");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (serviceId: string) =>
      serviceService.deleteService(store!.id, serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", store?.id] });
      toast.success("Service deleted");
    },
    onError: () => {
      toast.error("Failed to delete service");
    },
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

  const handleToggleVisibility = (service: Service) => {
    toggleVisibilityMutation.mutate({
      serviceId: service.id,
      isVisible: !service.isVisible,
    });
  };

  const handleDelete = (service: Service) => {
    if (window.confirm(`Are you sure you want to delete "${service.name}"?`)) {
      deleteMutation.mutate(service.id);
    }
  };

  return {
    state: {
      searchQuery,
      isCreateDialogOpen,
      editingService,
      isLoading,
      error,
    },
    actions: {
      setSearchQuery,
      setIsCreateDialogOpen,
      setEditingService,
      handleEdit,
      handleCloseDialog,
      handleToggleVisibility,
      handleDelete,
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
