/**
 * Customers List Page
 * Main page for viewing and managing customers
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Search,
  Loader2,
  AlertCircle,
  Users,
  LayoutGrid,
  List,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import { usePagination, useDebouncedSearch } from "@/hooks";
import { storeService, customerService } from "@/services";
import type { CustomerWithStats } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CustomerCard } from "@/components/customers/CustomerCard";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { cn } from "@/lib/utils";

export function CustomersList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const debouncedSearch = useDebouncedSearch(searchTerm);

  // Fetch user's store
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
  });

  // Fetch customers
  const {
    data: customers = [],
    isLoading: customersLoading,
    error,
  } = useQuery({
    queryKey: ["customers", store?.id, debouncedSearch],
    queryFn: () =>
      customerService.getCustomers(store!.id, {
        search: debouncedSearch || undefined,
      }),
    enabled: !!store?.id,
  });

  const isLoading = storeLoading || customersLoading;

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
    items: customers,
    itemsPerPage: 12,
  });

  const handleViewCustomer = (customer: CustomerWithStats) => {
    navigate(`/admin/customers/${customer.id}`);
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
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">
            View and manage your customer base
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load customers. Please try again later.
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-600 mt-1">View and manage your customer base</p>
      </div>

      {/* Customers List */}
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>All Customers</CardTitle>
            <CardDescription>
              {customers.length} customer{customers.length !== 1 ? "s" : ""}{" "}
              total
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center border rounded-md p-1 bg-gray-50">
              <Button
                variant={view === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setView("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setView("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {customers.length > 0 ? (
            <div
              className={cn(
                "flex flex-col",
                paginatedItems.length >= 7 && "min-h-[600px]"
              )}
            >
              {view === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {paginatedItems.map((customer) => (
                    <CustomerCard
                      key={customer.id}
                      customer={customer}
                      onView={handleViewCustomer}
                    />
                  ))}
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-medium">
                        <tr>
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3 hidden md:table-cell">
                            Contact
                          </th>
                          <th className="px-4 py-3 hidden lg:table-cell">
                            Stats
                          </th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {paginatedItems.map((customer) => (
                          <tr
                            key={customer.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleViewCustomer(customer)}
                          >
                            <td className="px-4 py-4">
                              <div className="font-medium text-gray-900">
                                {customer.firstName} {customer.lastName}
                              </div>
                              <div className="text-xs text-gray-500">
                                #{customer.id}
                              </div>
                            </td>
                            <td className="px-4 py-4 hidden md:table-cell">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center text-xs text-gray-600">
                                  <Mail className="h-3 w-3 mr-1.5" />
                                  {customer.email}
                                </div>
                                {customer.phone && (
                                  <div className="flex items-center text-xs text-gray-600">
                                    <Phone className="h-3 w-3 mr-1.5" />
                                    {customer.phone}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 hidden lg:table-cell">
                              <div className="flex flex-col gap-1">
                                <div className="text-xs text-gray-600">
                                  <span className="font-medium">
                                    {customer.totalAppointments}
                                  </span>{" "}
                                  appointments
                                </div>
                                {customer.lastAppointmentDate && (
                                  <div className="flex items-center text-[10px] text-gray-400">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Last:{" "}
                                    {format(
                                      new Date(customer.lastAppointmentDate),
                                      "MMM d, yyyy"
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <div className="mt-auto pt-6">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  canGoPrevious={canGoPrevious}
                  canGoNext={canGoNext}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  totalItems={customers.length}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "No customers found" : "No customers yet"}
              </h3>
              <p className="text-gray-600">
                {searchTerm
                  ? "Try adjusting your search query"
                  : "Customers will appear here when they book appointments"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
