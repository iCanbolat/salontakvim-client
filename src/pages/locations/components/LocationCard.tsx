/**
 * Location Card Component
 * Displays a location with its details and actions
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Phone, Mail } from "lucide-react";
import { locationService } from "@/services";
import type { Location } from "@/types";
import { qk } from "@/lib/query-keys";
import { EntityCard } from "@/components/common/EntityCard";
import { useConfirmDialog } from "@/contexts/ConfirmDialogProvider";

interface LocationCardProps {
  location: Location;
  storeId: string;
  onEdit: (location: Location) => void;
}

export function LocationCard({ location, storeId, onEdit }: LocationCardProps) {
  const queryClient = useQueryClient();
  const { confirm } = useConfirmDialog();

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => locationService.deleteLocation(storeId, location.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.locations(storeId) });
    },
  });

  // Toggle visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: () =>
      locationService.updateLocation(storeId, location.id, {
        isVisible: !location.isVisible,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.locations(storeId) });
    },
  });

  const handleDelete = () => {
    void confirm({
      title: "Delete location",
      description:
        "Are you sure you want to delete this location? This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
    }).then((isConfirmed) => {
      if (isConfirmed) {
        deleteMutation.mutate();
      }
    });
  };

  // Build full address string
  const fullAddress = [
    location.address,
    location.city,
    location.state,
    location.zipCode,
    location.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <EntityCard
      title={location.name}
      description={fullAddress}
      isVisible={location.isVisible}
      onEdit={() => onEdit(location)}
      onToggleVisibility={() => toggleVisibilityMutation.mutate()}
      onDelete={handleDelete}
      isToggling={toggleVisibilityMutation.isPending}
      isDeleting={deleteMutation.isPending}
      toggleTitle={location.isVisible ? "Hide Location" : "Show Location"}
      deleteTitle="Delete Location"
    >
      <div className="flex-1 space-y-3">
        {/* Phone */}
        {location.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4 shrink-0" />
            <span>{location.phone}</span>
          </div>
        )}

        {/* Email */}
        {location.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4 shrink-0" />
            <span className="truncate">{location.email}</span>
          </div>
        )}

        {/* Coordinates (if available) */}
        {location.latitude && location.longitude && (
          <div className="text-xs text-gray-500">
            Coordinates: {location.latitude}, {location.longitude}
          </div>
        )}
      </div>
    </EntityCard>
  );
}
