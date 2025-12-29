/**
 * Services List Page
 * Displays and manages all services with create/edit functionality
 */

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Loader2, AlertCircle, Search } from "lucide-react";
import { usePagination } from "@/hooks";
import { storeService, serviceService } from "@/services";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ServiceCard, ServiceFormDialog } from "@/components/services";
import {
  PageView,
  TableView,
  type TableColumn,
} from "@/components/common/page-view";
import type { Service } from "@/types";

export function ServicesList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");

  // Fetch user's store
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
  });

  // Fetch services
  const {
    data: services,
    isLoading: servicesLoading,
    error,
  } = useQuery({
    queryKey: ["services", store?.id],
    queryFn: () => serviceService.getServices(store!.id),
    enabled: !!store?.id,
  });

  const isLoading = storeLoading || servicesLoading;

  // Filter services based on search
  const filteredServices = services?.filter(
    (service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const {
    paginatedItems,
    currentPage,
    totalPages,
    goToPage,
    startIndex,
    endIndex,
  } = usePagination({
    items: filteredServices || [],
    itemsPerPage: 6,
  });

  useEffect(() => {
    goToPage(1);
  }, [searchQuery, goToPage]);

  const tableColumns: TableColumn<Service>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Service",
        render: (service) => (
          <div className="flex items-center gap-2">
            {service.color && (
              <span
                className="h-3 w-3 rounded-full border border-border"
                style={{ backgroundColor: service.color }}
                aria-label="Service color"
              />
            )}
            <div className="flex flex-col">
              <span className="font-medium">{service.name}</span>
              {service.description && (
                <span className="text-sm text-muted-foreground line-clamp-1">
                  {service.description}
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        key: "duration",
        header: "Duration",
        render: (service) => <span>{service.duration} min</span>,
        hideOnMobile: true,
      },
      {
        key: "capacity",
        header: "Capacity",
        render: (service) => (
          <span>
            {service.capacity} {service.capacity === 1 ? "person" : "people"}
          </span>
        ),
        hideOnMobile: true,
      },
      {
        key: "price",
        header: "Price",
        render: (service) => (
          <span className="font-medium">
            ₺{Number(service.price).toFixed(2)}
          </span>
        ),
        hideOnMobile: true,
        hideOnTablet: true,
      },
      {
        key: "visibility",
        header: "Visibility",
        render: (service) => (
          <span className="text-sm font-medium">
            {service.isVisible ? "Visible" : "Hidden"}
          </span>
        ),
        hideOnTablet: true,
      },
      {
        key: "actions",
        header: "",
        render: (service) => (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setEditingService(service);
            }}
          >
            Edit
          </Button>
        ),
        cellClassName: "text-right",
      },
    ],
    [setEditingService]
  );

  const handleEdit = (service: Service) => {
    setEditingService(service);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingService(null);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600 mt-1">
            Manage your services and offerings
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      <PageView<Service>
        data={paginatedItems}
        searchValue={searchQuery}
        onSearchChange={(value) => setSearchQuery(value)}
        searchPlaceholder="Search services..."
        view={view}
        onViewChange={setView}
        gridMinColumnClassName="md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]"
        gridMinHeightClassName="min-h-[600px]"
        renderGridItem={(service) => (
          <ServiceCard
            key={service.id}
            service={service}
            storeId={store.id}
            onEdit={handleEdit}
          />
        )}
        renderTableView={(data) => (
          <TableView
            data={data}
            columns={tableColumns}
            getRowKey={(service) => service.id}
            onRowClick={setEditingService}
          />
        )}
        currentPage={totalPages === 0 ? 1 : currentPage}
        totalPages={Math.max(totalPages, 1)}
        onPageChange={goToPage}
        startIndex={paginatedItems.length === 0 ? 0 : startIndex}
        endIndex={paginatedItems.length === 0 ? 0 : endIndex}
        totalItems={filteredServices?.length ?? 0}
        emptyIcon={<Search className="h-12 w-12 text-gray-400 mx-auto" />}
        emptyTitle={searchQuery ? "No services found" : "No services yet"}
        emptyDescription={
          searchQuery
            ? "Try adjusting your search keywords"
            : "Get started by creating your first service"
        }
        emptyAction={
          !searchQuery && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
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
        onClose={handleCloseDialog}
      />
    </div>
  );
}
