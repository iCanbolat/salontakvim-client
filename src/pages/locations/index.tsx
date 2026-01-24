import { useMemo } from "react";
import { Plus, Loader2, AlertCircle, MapPin } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { PageView, TableView } from "../../components/common/page-view";
import { LocationCard, LocationFormDialog } from "./components";
import type { Location } from "../../types";
import { useLocations } from "./hooks/useLocations";
import { getLocationColumns } from "./table-columns";

export function LocationsList() {
  const { state, actions, data, pagination } = useLocations();
  const {
    searchTerm,
    isCreateDialogOpen,
    editingLocation,
    view,
    isLoading,
    error,
  } = state;
  const { store, filteredLocations } = data;

  const tableColumns = useMemo(
    () => getLocationColumns({ onEdit: actions.handleEdit }),
    [actions.handleEdit],
  );

  if (isLoading && !filteredLocations.length) {
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
          <p className="text-gray-600 mt-1">Manage your business branches</p>
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

  if (!store) return null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row text-center sm:text-start items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Locations</h1>
          <p className="text-gray-600 mt-1">
            Manage your business branches and service areas
          </p>
        </div>
        <Button onClick={() => actions.setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      <PageView<Location>
        data={pagination.paginatedItems}
        searchValue={searchTerm}
        onSearchChange={actions.setSearchTerm}
        searchPlaceholder="Search locations..."
        view={view}
        onViewChange={actions.setView}
        gridMinColumnClassName="md:grid-cols-2 xl:grid-cols-3"
        gridMinHeightClassName="min-h-[600px]"
        renderGridItem={(location: Location) => (
          <LocationCard
            key={location.id}
            location={location}
            storeId={store.id}
            onEdit={actions.handleEdit}
          />
        )}
        renderTableView={(data: Location[]) => (
          <TableView
            data={data}
            columns={tableColumns}
            getRowKey={(location: Location) => location.id}
            onRowClick={actions.handleEdit}
          />
        )}
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={pagination.goToPage}
        startIndex={pagination.startIndex}
        endIndex={pagination.endIndex}
        totalItems={filteredLocations.length}
        emptyIcon={<MapPin className="h-12 w-12 text-gray-400 mx-auto" />}
        emptyTitle={searchTerm ? "No locations found" : "No locations yet"}
        emptyDescription={
          searchTerm
            ? "Try adjusting your search keywords"
            : "Add locations to manage multiple branches"
        }
        emptyAction={
          !searchTerm && (
            <Button onClick={() => actions.setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          )
        }
      />

      {/* Create/Edit Dialog */}
      <LocationFormDialog
        storeId={store.id}
        location={editingLocation}
        open={isCreateDialogOpen}
        onClose={actions.handleCloseDialog}
      />
    </div>
  );
}
