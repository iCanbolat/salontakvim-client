/**
 * Services List Page
 * Displays and manages all services with create/edit functionality
 */

import { useMemo } from "react";
import { Plus, Loader2, AlertCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ServiceCard, ServiceFormDialog } from "./components";
import { PageView, TableView } from "@/components/common/page-view";
import type { Service } from "@/types";
import { useServices } from "./hooks/useServices";
import { getServiceColumns } from "./table-columns";

export function ServicesList() {
  const { state, actions, data, pagination } = useServices();
  const {
    searchQuery,
    isCreateDialogOpen,
    editingService,
    view,
    isLoading,
    error,
  } = state;

  const { store, paginatedServices, totalCount } = data;
  const { currentPage, totalPages, startIndex, endIndex } = pagination;

  const tableColumns = useMemo(
    () => getServiceColumns({ onEdit: actions.handleEdit }),
    [actions.handleEdit],
  );

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
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600 mt-1">
            Manage your services and offerings
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load services. Please try again later.
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
      <div className="flex flex-col sm:flex-row text-center sm:text-start items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600 mt-1">
            Manage your services and offerings
          </p>
        </div>
        <Button onClick={() => actions.setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      <PageView<Service>
        data={paginatedServices}
        searchValue={searchQuery}
        onSearchChange={actions.setSearchQuery}
        searchPlaceholder="Search services..."
        view={view}
        onViewChange={actions.setView}
        gridMinColumnClassName="md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]"
        gridMinHeightClassName="min-h-[600px]"
        renderGridItem={(service) => (
          <ServiceCard
            key={service.id}
            service={service}
            storeId={store.id}
            onEdit={actions.handleEdit}
          />
        )}
        renderTableView={(data) => (
          <TableView
            data={data}
            columns={tableColumns}
            getRowKey={(service) => service.id}
            onRowClick={actions.setEditingService}
          />
        )}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={actions.goToPage}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={totalCount}
        emptyIcon={<Search className="h-12 w-12 text-gray-400 mx-auto" />}
        emptyTitle={searchQuery ? "No services found" : "No services yet"}
        emptyDescription={
          searchQuery
            ? "Try adjusting your search keywords"
            : "Get started by creating your first service"
        }
        emptyAction={
          !searchQuery && (
            <Button onClick={() => actions.setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          )
        }
      />

      {/* Create/Edit Dialog */}
      <ServiceFormDialog
        storeId={store.id}
        service={editingService}
        open={isCreateDialogOpen || !!editingService}
        onClose={actions.handleCloseDialog}
      />
    </div>
  );
}
