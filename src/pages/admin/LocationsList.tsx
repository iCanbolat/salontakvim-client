/**
 * Locations List Page
 * Displays and manages all locations with create/edit functionality
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Loader2, AlertCircle, MapPin } from "lucide-react";
import { usePagination } from "@/hooks";
import { storeService, locationService } from "@/services";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LocationCard } from "@/components/locations/LocationCard";
import { LocationFormDialog } from "@/components/locations/LocationFormDialog";
import {
  PageView,
  TableView,
  type TableColumn,
} from "@/components/common/page-view";
import type { Location } from "@/types";

export function LocationsList() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

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

  const filteredLocations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term || !locations) return locations ?? [];

    return locations.filter((location) => {
      const haystacks = [
        location.name,
        location.address,
        location.city,
        location.state,
        location.zipCode,
      ]
        .filter(Boolean)
        .map((value) => value!.toLowerCase());

      return haystacks.some((value) => value.includes(term));
    });
  }, [locations, searchTerm]);

  const {
    paginatedItems,
    currentPage,
    totalPages,
    goToPage,
    startIndex,
    endIndex,
  } = usePagination({
    items: filteredLocations,
    itemsPerPage: 9,
  });

  const handlePageChange = (page: number) => {
    goToPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const emptyTitle = searchTerm
    ? "No locations match your search"
    : "No locations yet";
  const emptyDescription = searchTerm
    ? "Try a different name or address"
    : "Add locations to manage multiple branches or service areas";

  const locationColumns: TableColumn<Location>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Location",
        render: (location) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-gray-900">{location.name}</span>
            <span className="text-xs text-muted-foreground">
              {location.address}
            </span>
          </div>
        ),
      },
      {
        key: "city",
        header: "City",
        render: (location) => (
          <span className="text-sm text-gray-700">{location.city}</span>
        ),
        hideOnMobile: true,
      },
      {
        key: "actions",
        header: "Actions",
        headerClassName: "text-right",
        cellClassName: "text-right",
        render: (location) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(location)}
          >
            Edit
          </Button>
        ),
      },
    ],
    []
  );

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

      <PageView<Location>
        data={paginatedItems}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search locations..."
        view={view}
        onViewChange={setView}
        renderGridItem={(location) => (
          <LocationCard
            key={location.id}
            location={location}
            storeId={store.id}
            onEdit={handleEdit}
          />
        )}
        renderTableView={(data) => (
          <TableView
            data={data}
            columns={locationColumns}
            getRowKey={(location) => location.id}
            onRowClick={handleEdit}
          />
        )}
        gridMinColumnClassName="md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]"
        currentPage={totalPages === 0 ? 1 : currentPage}
        totalPages={Math.max(totalPages, 1)}
        onPageChange={handlePageChange}
        startIndex={paginatedItems.length === 0 ? 0 : startIndex}
        endIndex={paginatedItems.length === 0 ? 0 : endIndex}
        totalItems={filteredLocations.length}
        emptyIcon={<MapPin className="h-12 w-12 text-gray-400 mx-auto" />}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        emptyAction={
          !searchTerm ? (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          ) : undefined
        }
      />

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
