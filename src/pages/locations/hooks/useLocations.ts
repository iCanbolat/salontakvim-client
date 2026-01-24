import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { storeService, locationService } from "@/services";
import { usePagination } from "@/hooks";
import type { Location } from "@/types";

export function useLocations() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
  });

  const {
    data: locations,
    isLoading: locationsLoading,
    error,
  } = useQuery({
    queryKey: ["locations", store?.id],
    queryFn: () => locationService.getLocations(store!.id),
    enabled: !!store?.id,
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
      view,
      isLoading,
      error,
    },
    actions: {
      setSearchTerm,
      setIsCreateDialogOpen,
      handleEdit,
      handleCloseDialog,
      setView,
    },
    data: {
      store,
      locations,
      filteredLocations,
    },
    pagination,
  };
}
