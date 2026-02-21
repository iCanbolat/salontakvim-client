import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { locationService } from "@/services";
import { usePagination, useCurrentStore } from "@/hooks";
import type { Location } from "@/types";

export function useLocations() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { store, isLoading: storeLoading } = useCurrentStore();

  const {
    data: locations,
    isLoading: locationsLoading,
    error,
  } = useQuery({
    queryKey: ["locations", store?.id],
    queryFn: () => locationService.getLocations(store!.id),
    enabled: !!store?.id,
  });

  const toggleVisibility = useMutation({
    mutationFn: ({
      locationId,
      isVisible,
    }: {
      locationId: string;
      isVisible: boolean;
    }) => locationService.updateLocation(store!.id, locationId, { isVisible }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations", store?.id] });
      toast.success("Location visibility updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update location visibility: " + error.message);
    },
  });

  const deleteLocation = useMutation({
    mutationFn: (locationId: string) =>
      locationService.deleteLocation(store!.id, locationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations", store?.id] });
      toast.success("Location deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete location: " + error.message);
    },
  });

  const filteredLocations = (locations || []).filter((location) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;

    return [
      location.name,
      location.address,
      location.city,
      location.state,
      location.zipCode,
    ]
      .filter(Boolean)
      .map((value) => value!.toLowerCase())
      .some((value) => value.includes(term));
  });

  const pagination = usePagination({
    items: filteredLocations,
    itemsPerPage: 9,
  });

  const isLoading = storeLoading || locationsLoading;

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setIsCreateDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingLocation(null);
  };

  return {
    state: {
      searchTerm,
      isCreateDialogOpen,
      editingLocation,
      isLoading,
      error,
    },
    actions: {
      setSearchTerm,
      setIsCreateDialogOpen,
      handleEdit,
      handleCloseDialog,
      toggleVisibility: toggleVisibility.mutate,
      deleteLocation: deleteLocation.mutate,
    },
    data: {
      store,
      locations,
      filteredLocations,
    },
    pagination,
  };
}
