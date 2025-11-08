/**
 * Locations List Page
 * Displays and manages all locations with create/edit functionality
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Loader2, AlertCircle, MapPin } from "lucide-react";
import { useRequireRole } from "@/hooks";
import { storeService, locationService } from "@/services";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LocationCard } from "@/components/locations/LocationCard";
import { LocationFormDialog } from "@/components/locations/LocationFormDialog";
import type { Location } from "@/types";

export function LocationsList() {
  useRequireRole("admin");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  // Fetch user's store
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
  });

  // Fetch locations
  const {
    data: locations,
    isLoading: locationsLoading,
    error,
  } = useQuery({
    queryKey: ["locations", store?.id],
    queryFn: () => locationService.getLocations(store!.id),
    enabled: !!store?.id,
  });

  const isLoading = storeLoading || locationsLoading;

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingLocation(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Locations</h1>
          <p className="text-gray-600 mt-1">Manage your business locations</p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load locations. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!store) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Locations</h1>
          <p className="text-gray-600 mt-1">
            Manage your business locations and branches
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Locations List */}
      <Card>
        <CardHeader>
          <CardTitle>All Locations</CardTitle>
          <CardDescription>
            {locations?.length || 0} location
            {locations?.length !== 1 ? "s" : ""} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {locations && locations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations.map((location) => (
                <LocationCard
                  key={location.id}
                  location={location}
                  storeId={store.id}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No locations yet
              </h3>
              <p className="text-gray-600 mb-4">
                Add locations to manage multiple branches or service areas
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <LocationFormDialog
        storeId={store.id}
        location={editingLocation}
        open={isCreateDialogOpen || !!editingLocation}
        onClose={handleCloseDialog}
      />
    </div>
  );
}
