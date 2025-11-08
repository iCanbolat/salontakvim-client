/**
 * Customers List Page
 * Main page for viewing and managing customers
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, AlertCircle, Users } from "lucide-react";
import { useRequireRole } from "@/hooks";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CustomerCard } from "@/components/customers/CustomerCard";
import { CustomerProfile as CustomerProfileDialog } from "@/components/customers/CustomerProfile";

export function CustomersList() {
  useRequireRole("admin");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null
  );

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
    queryKey: ["customers", store?.id, searchQuery],
    queryFn: () =>
      customerService.getCustomers(store!.id, {
        search: searchQuery || undefined,
      }),
    enabled: !!store?.id,
  });

  // Fetch customer profile
  const { data: customerProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["customer-profile", store?.id, selectedCustomerId],
    queryFn: () =>
      customerService.getCustomerProfile(store!.id, selectedCustomerId!),
    enabled: !!store?.id && !!selectedCustomerId,
  });

  const isLoading = storeLoading || customersLoading;

  const handleViewCustomer = (customer: CustomerWithStats) => {
    setSelectedCustomerId(customer.id);
  };

  const handleCloseProfile = () => {
    setSelectedCustomerId(null);
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

      {/* Search & Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Customers</CardTitle>
          <CardDescription>
            Search by name, email, or phone number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>
            {customers.length} customer{customers.length !== 1 ? "s" : ""} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customers.map((customer) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  onView={handleViewCustomer}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? "No customers found" : "No customers yet"}
              </h3>
              <p className="text-gray-600">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Customers will appear here when they book appointments"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Profile Dialog */}
      <CustomerProfileDialog
        profile={customerProfile || null}
        open={!!selectedCustomerId && !profileLoading}
        onClose={handleCloseProfile}
      />
    </div>
  );
}
