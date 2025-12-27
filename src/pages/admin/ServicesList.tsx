/**
 * Services List Page
 * Displays and manages all services with create/edit functionality
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Loader2, AlertCircle, Search } from "lucide-react";
import { usePagination } from "@/hooks";
import { storeService, serviceService } from "@/services";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ServiceCard, ServiceFormDialog } from "@/components/services";
import { PaginationControls } from "@/components/ui/PaginationControls";
import type { Service } from "@/types";

export function ServicesList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

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
    canGoNext,
    canGoPrevious,
    startIndex,
    endIndex,
  } = usePagination({
    items: filteredServices || [],
    itemsPerPage: 6,
  });

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

      {/* Search and Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Services</CardTitle>
              <CardDescription>
                {services?.length || 0} service
                {services?.length !== 1 ? "s" : ""} total
              </CardDescription>
            </div>
            <div className="w-72">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredServices && filteredServices.length > 0 ? (
            <div
              className={`flex flex-col ${
                totalPages > 1 ? "min-h-[600px]" : ""
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 pb-4">
                {paginatedItems.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    storeId={store.id}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
              <div className="mt-auto">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  canGoPrevious={canGoPrevious}
                  canGoNext={canGoNext}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  totalItems={filteredServices.length}
                />
              </div>
            </div>
          ) : searchQuery ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No services found
              </h3>
              <p className="text-gray-600">Try adjusting your search query</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No services yet
              </h3>
              <p className="text-gray-600 mb-4">
                Get started by creating your first service
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
