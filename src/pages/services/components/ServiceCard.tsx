/**
 * Service Card Component
 * Displays a service with its details and actions
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Users } from "lucide-react";
import { serviceService } from "@/services";
import type { Service } from "@/types";
import { qk } from "@/lib/query-keys";
import { formatCurrency } from "@/utils";
import { EntityCard } from "@/components/common/EntityCard";

interface ServiceCardProps {
  service: Service;
  storeId: string;
  currency: string;
  onEdit: (service: Service) => void;
}

export function ServiceCard({
  service,
  storeId,
  currency,
  onEdit,
}: ServiceCardProps) {
  const queryClient = useQueryClient();

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => serviceService.deleteService(storeId, service.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.services(storeId) });
    },
  });

  // Toggle visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: () =>
      serviceService.updateService(storeId, service.id, {
        isVisible: !service.isVisible,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.services(storeId) });
    },
  });

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this service?")) {
      deleteMutation.mutate();
    }
  };

  const formattedPrice = formatCurrency(service.price, currency);

  return (
    <EntityCard
      title={service.name}
      description={service.description}
      color={service.categoryColor}
      isVisible={service.isVisible}
      onEdit={() => onEdit(service)}
      onToggleVisibility={() => toggleVisibilityMutation.mutate()}
      onDelete={handleDelete}
      isToggling={toggleVisibilityMutation.isPending}
      isDeleting={deleteMutation.isPending}
    >
      <div className="flex-1 space-y-3">
        {/* Service Details */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{service.duration} min</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Users className="h-4 w-4" />
            <span>
              {service.capacity} {service.capacity === 1 ? "person" : "people"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <span className="font-medium">{formattedPrice}</span>
          </div>
        </div>

        {/* Buffer Times */}
        {(service.bufferTimeBefore > 0 || service.bufferTimeAfter > 0) && (
          <div className="text-xs text-gray-500">
            Buffer:{" "}
            {service.bufferTimeBefore > 0 &&
              `${service.bufferTimeBefore}m before`}
            {service.bufferTimeBefore > 0 &&
              service.bufferTimeAfter > 0 &&
              ", "}
            {service.bufferTimeAfter > 0 && `${service.bufferTimeAfter}m after`}
          </div>
        )}

        {/* Extras Count */}
        {service.extras && service.extras.length > 0 && (
          <div className="text-xs text-gray-500">
            {service.extras.length} extra
            {service.extras.length !== 1 ? "s" : ""} available
          </div>
        )}
      </div>
    </EntityCard>
  );
}
