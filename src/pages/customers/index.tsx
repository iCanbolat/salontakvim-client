/**
 * Customers List Page
 * Main page for viewing and managing customers
 */

import { useMemo } from "react";
import {
  Loader2,
  AlertCircle,
  Users,
  MessageSquare,
  Tag,
  X,
} from "lucide-react";
import type { CustomerWithStats } from "@/types";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CustomerCard, SmsDialog, DiscountDialog } from "./components";
import { PageView, TableView } from "@/components/common/page-view";
import { useCustomers } from "./hooks/useCustomers";
import { getCustomerColumns } from "./table-columns";

export function CustomersList() {
  const { store, state, data, actions } = useCustomers();

  const {
    searchTerm,
    canAssignCoupons,
    selectedCustomers,
    isSmsDialogOpen,
    isDiscountDialogOpen,
    isSendingSms,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    isInitialLoading,
    error,
    isAllCustomersSelected,
  } = state;

  const { customers, totalCount, selectedCustomersData } = data;

  const {
    setSearchTerm,
    setIsSmsDialogOpen,
    setIsDiscountDialogOpen,
    goToPage,
    handleViewCustomer,
    handleSelectCustomer,
    handleSelectAll,
    handleSelectAllInTotal,
    handleSendSms,
    setSelectedCustomers,
  } = actions;

  const customerColumns = useMemo(
    () =>
      getCustomerColumns({
        canAssignCoupons,
        onDiscount: (customer) => {
          setSelectedCustomers([customer.id]);
          setIsDiscountDialogOpen(true);
        },
        onSms: (customer) => {
          setSelectedCustomers([customer.id]);
          setIsSmsDialogOpen(true);
        },
      }),
    [
      canAssignCoupons,
      setSelectedCustomers,
      setIsDiscountDialogOpen,
      setIsSmsDialogOpen,
    ],
  );

  if (isInitialLoading) {
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

  // Empty state messages based on search
  const emptyTitle = searchTerm
    ? `No customers matching "${searchTerm}"`
    : "No customers yet";

  const emptyDescription = searchTerm
    ? "Try adjusting your search query"
    : "Customers will appear here when they book appointments";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row text-center sm:text-start items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">
            View and manage your customer base
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {!isAllCustomersSelected && totalCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAllInTotal}
              className="gap-2"
            >
              Select all {totalCount} customers
            </Button>
          )}
          {selectedCustomers.length > 0 && (
            <>
              {canAssignCoupons && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setIsDiscountDialogOpen(true)}
                  className="gap-2"
                >
                  <Tag className="h-4 w-4" />
                  İndirim ({selectedCustomers.length})
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSmsDialogOpen(true)}
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                SMS ({selectedCustomers.length})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCustomers([])}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <PageView<CustomerWithStats>
        data={customers}
        viewKey="customers"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search customers..."
        gridMinColumnClassName="md:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]"
        gridMinHeightClassName="min-h-[600px]"
        renderGridItem={(customer) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            onView={handleViewCustomer}
            isSelected={selectedCustomers.includes(customer.id)}
            onSelectChange={(checked) =>
              handleSelectCustomer(customer.id, checked)
            }
          />
        )}
        renderTableView={(data) => (
          <TableView
            data={data}
            columns={customerColumns}
            getRowKey={(customer) => customer.id}
            onRowClick={handleViewCustomer}
            enableSelection
            selectedKeys={selectedCustomers}
            onToggleRow={(key, _, checked) =>
              handleSelectCustomer(key, checked)
            }
            onToggleAll={handleSelectAll}
          />
        )}
        currentPage={totalPages === 0 ? 1 : currentPage}
        totalPages={Math.max(totalPages, 1)}
        onPageChange={goToPage}
        startIndex={customers.length === 0 ? 0 : startIndex}
        endIndex={customers.length === 0 ? 0 : endIndex}
        totalItems={totalCount}
        emptyIcon={<Users className="h-12 w-12 text-gray-400 mx-auto" />}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        contentClassName="pt-0"
      />

      <SmsDialog
        isOpen={isSmsDialogOpen}
        onClose={() => setIsSmsDialogOpen(false)}
        selectedCustomers={selectedCustomersData}
        onSend={handleSendSms}
        isSending={isSendingSms}
      />

      {canAssignCoupons && (
        <DiscountDialog
          isOpen={isDiscountDialogOpen}
          onClose={() => {
            setIsDiscountDialogOpen(false);
            setSelectedCustomers([]);
          }}
          selectedCustomers={selectedCustomersData}
          storeId={store.id}
        />
      )}
    </div>
  );
}
