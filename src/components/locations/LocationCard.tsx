/**
 * Location Card Component
 * Displays a location with its details and actions
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Trash2, Eye, EyeOff, MapPin, Phone, Mail } from "lucide-react";
import { locationService } from "@/services";
import type { Location } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LocationCardProps {
  location: Location;
  storeId: number;
  onEdit: (location: Location) => void;
}

export function LocationCard({ location, storeId, onEdit }: LocationCardProps) {
  const queryClient = useQueryClient();

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => locationService.deleteLocation(storeId, location.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations", storeId] });
    },
  });

  // Toggle visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: () =>
      locationService.updateLocation(storeId, location.id, {
        isVisible: !location.isVisible,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations", storeId] });
    },
  });

  const handleDelete = () => {
    if (
      confirm(
        "Are you sure you want to delete this location? This action cannot be undone."
      )
    ) {
      deleteMutation.mutate();
    }
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
    <Card
      className={`flex flex-col ${!location.isVisible ? "opacity-60" : ""}`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg">{location.name}</CardTitle>
              {!location.isVisible && (
                <Badge variant="secondary" className="text-xs">
                  Hidden
                </Badge>
              )}
            </div>
            {fullAddress && (
              <CardDescription className="line-clamp-2">
                {fullAddress}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-1">
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
      </CardContent>

      {/* Action Buttons */}
      <CardFooter className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(location)}
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
          {location.isVisible ? (
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
