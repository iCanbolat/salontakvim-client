/**
 * Services List Page
 * Displays and manages all services and categories with create/edit functionality
 */

import { useMemo } from "react";
import {
  Plus,
  Loader2,
  AlertCircle,
  Search,
  Layers,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ServiceCard,
  ServiceFormDialog,
  CategoryCard,
  CategoryFormDialog,
} from "./components";
import { PageView, TableView } from "@/components/common/page-view";
import type { Service, Category } from "@/types";
import { useServices } from "./hooks/useServices";
import { useCategories } from "./hooks/useCategories";
import { getServiceColumns } from "./table-columns";

export function ServicesList() {
  const {
    state: serviceState,
    actions: serviceActions,
    data: serviceData,
    pagination: servicePagination,
  } = useServices();

  const {
    state: categoryState,
    actions: categoryActions,
    data: categoryData,
    pagination: categoryPagination,
  } = useCategories();

  const {
    searchQuery: serviceSearch,
    isCreateDialogOpen: isServiceDialogOpen,
    editingService,
    view: serviceView,
    isLoading: serviceLoading,
    error: serviceError,
  } = serviceState;

  const {
    searchQuery: categorySearch,
    isCategoryDialogOpen,
    editingCategory,
    view: categoryView,
    isLoading: categoryLoading,
    error: categoryError,
  } = categoryState;

  const { store, paginatedServices, totalCount: serviceCount } = serviceData;
  const { paginatedCategories, totalCount: categoryCount } = categoryData;

  const {
    currentPage: servicePage,
    totalPages: serviceTotalPages,
    startIndex: serviceStart,
    endIndex: serviceEnd,
  } = servicePagination;

  const {
    currentPage: categoryPage,
    totalPages: categoryTotalPages,
    startIndex: categoryStart,
    endIndex: categoryEnd,
  } = categoryPagination;

  const tableColumns = useMemo(
    () => getServiceColumns({ onEdit: serviceActions.handleEdit }),
    [serviceActions.handleEdit],
  );

  const isLoading = serviceLoading || categoryLoading;
  const error = serviceError || categoryError;

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
          <h1 className="text-3xl font-bold text-gray-900">
            Services & Categories
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your service categories and individual offerings
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load data. Please try again later.
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
            Manage your categories and services
          </p>
        </div>
      </div>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Services
          </TabsTrigger>
        </TabsList>

        {/* Categories Tab Content */}
        <TabsContent value="categories" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Service Categories</h2>
            <Button
              onClick={() => categoryActions.setIsCategoryDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>

          <PageView<Category>
            data={paginatedCategories}
            searchValue={categorySearch}
            onSearchChange={categoryActions.setSearchQuery}
            searchPlaceholder="Search categories..."
            view={categoryView}
            onViewChange={categoryActions.setView}
            gridMinColumnClassName="md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]"
            gridMinHeightClassName="min-h-[500px]"
            renderGridItem={(category) => (
              <CategoryCard
                key={category.id}
                category={category}
                storeId={store.id}
                onEdit={categoryActions.handleEdit}
              />
            )}
            currentPage={categoryPage}
            totalPages={categoryTotalPages}
            onPageChange={categoryActions.goToPage}
            startIndex={categoryStart}
            endIndex={categoryEnd}
            totalItems={categoryCount}
            emptyIcon={<Layers className="h-12 w-12 text-gray-400 mx-auto" />}
            emptyTitle={
              categorySearch ? "No categories found" : "No categories yet"
            }
            emptyDescription={
              categorySearch
                ? "Try adjusting your search keywords"
                : "Create categories to group your services"
            }
            emptyAction={
              !categorySearch && (
                <Button
                  onClick={() => categoryActions.setIsCategoryDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              )
            }
          />
        </TabsContent>

        {/* Services Tab Content */}
        <TabsContent value="services" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Our Services</h2>
            <Button onClick={() => serviceActions.setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>

          <PageView<Service>
            data={paginatedServices}
            searchValue={serviceSearch}
            onSearchChange={serviceActions.setSearchQuery}
            searchPlaceholder="Search services..."
            view={serviceView}
            onViewChange={serviceActions.setView}
            gridMinColumnClassName="md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]"
            gridMinHeightClassName="min-h-[500px]"
            renderGridItem={(service) => (
              <ServiceCard
                key={service.id}
                service={service}
                storeId={store.id}
                onEdit={serviceActions.handleEdit}
              />
            )}
            renderTableView={(data) => (
              <TableView
                data={data}
                columns={tableColumns}
                getRowKey={(service) => service.id}
                onRowClick={serviceActions.setEditingService}
              />
            )}
            currentPage={servicePage}
            totalPages={serviceTotalPages}
            onPageChange={serviceActions.goToPage}
            startIndex={serviceStart}
            endIndex={serviceEnd}
            totalItems={serviceCount}
            emptyIcon={<Search className="h-12 w-12 text-gray-400 mx-auto" />}
            emptyTitle={serviceSearch ? "No services found" : "No services yet"}
            emptyDescription={
              serviceSearch
                ? "Try adjusting your search keywords"
                : "Get started by creating your first service"
            }
            emptyAction={
              !serviceSearch && (
                <Button
                  onClick={() => serviceActions.setIsCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              )
            }
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ServiceFormDialog
        storeId={store.id}
        service={editingService}
        open={isServiceDialogOpen || !!editingService}
        onClose={serviceActions.handleCloseDialog}
      />

      <CategoryFormDialog
        storeId={store.id}
        category={editingCategory}
        open={isCategoryDialogOpen || !!editingCategory}
        onClose={categoryActions.handleCloseDialog}
      />
    </div>
  );
}
