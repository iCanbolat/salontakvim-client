/**
 * Service Card Component
 * Displays a service with its details and actions
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Trash2, Eye, EyeOff, Clock, Users } from "lucide-react";
import { serviceService } from "@/services";
import type { Service } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ServiceCardProps {
  service: Service;
  storeId: string;
  onEdit: (service: Service) => void;
}

export function ServiceCard({ service, storeId, onEdit }: ServiceCardProps) {
  const queryClient = useQueryClient();

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => serviceService.deleteService(storeId, service.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", storeId] });
    },
  });

  // Toggle visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: () =>
      serviceService.updateService(storeId, service.id, {
        isVisible: !service.isVisible,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", storeId] });
    },
  });

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this service?")) {
      deleteMutation.mutate();
    }
  };

  const price = parseFloat(service.price);
  const currency = "USD"; // TODO: Get from store settings

  return (
    <Card className={`flex flex-col ${!service.isVisible ? "opacity-60" : ""}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg">{service.name}</CardTitle>
              {!service.isVisible && (
                <Badge variant="secondary" className="text-xs">
                  Hidden
                </Badge>
              )}
            </div>
            {service.description && (
              <CardDescription className="line-clamp-2">
                {service.description}
              </CardDescription>
            )}
          </div>
          {service.color && (
            <div
              className="w-4 h-4 rounded-full ml-2 shrink-0"
              style={{ backgroundColor: service.color }}
              title={service.color}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-1">
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
            {/* <DollarSign className="h-4 w-4" /> */}
            <span className="font-medium">
              {price.toFixed(2)} {currency}
            </span>
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
      </CardContent>

      {/* Action Buttons */}
      <CardFooter className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(service)}
          className="flex-1"
        >
          <Edit className="h-3.5 w-3.5 mr-1.5" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => toggleVisibilityMutation.mutate()}
          disabled={toggleVisibilityMutation.isPending}
        >
          {service.isVisible ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}
