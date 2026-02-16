/**
 * Customers List Page
 * Main page for viewing and managing customers
 */

import { useMemo } from "react";
import { format } from "date-fns";
import {
  Loader2,
  AlertCircle,
  Users,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Tag,
  X,
} from "lucide-react";
import type { CustomerWithStats } from "@/types";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CustomerCard, SmsDialog, DiscountDialog } from "./components";
import {
  PageView,
  TableView,
  type TableColumn,
} from "@/components/common/page-view";
import { useCustomers } from "./hooks/useCustomers";

export function CustomersList() {
  const { store, state, data, actions } = useCustomers();

  const {
    searchTerm,
    view,
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
    setView,
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

  const customerColumns: TableColumn<CustomerWithStats>[] = useMemo(
    () => [
      {
        key: "customer",
        header: "Customer",
        render: (customer) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-gray-900">
              {customer.firstName} {customer.lastName}
            </span>
            <span className="text-xs text-gray-500">
              #{customer.publicNumber || customer.id}
            </span>
          </div>
        ),
      },
      {
        key: "contact",
        header: "Contact",
        hideOnMobile: true,
        render: (customer) => (
          <div className="flex flex-col gap-1 text-xs text-gray-600">
            <div className="flex items-center">
              <Mail className="h-3 w-3 mr-1.5" />
              {customer.email}
            </div>
            {customer.phone && (
              <div className="flex items-center">
                <Phone className="h-3 w-3 mr-1.5" />
                {customer.phone}
              </div>
            )}
          </div>
        ),
      },
      {
        key: "stats",
        header: "Stats",
        hideOnTablet: true,
        render: (customer) => (
          <div className="flex flex-col gap-1 text-xs text-gray-600">
            <div>
              <span className="font-medium">{customer.totalAppointments}</span>{" "}
              appointments
            </div>
            {customer.lastAppointmentDate && (
              <div className="flex items-center text-[10px] text-gray-400">
                <Calendar className="h-3 w-3 mr-1" />
                Last:{" "}
                {format(new Date(customer.lastAppointmentDate), "MMM d, yyyy")}
              </div>
            )}
          </div>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        headerClassName: "text-right",
        cellClassName: "text-right",
        render: (customer) => (
          <div className="flex items-center justify-end gap-2">
            {canAssignCoupons && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCustomers([customer.id]);
                  setIsDiscountDialogOpen(true);
                }}
                title="İndirim Tanımla"
              >
                <Tag className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCustomers([customer.id]);
                setIsSmsDialogOpen(true);
              }}
              title="SMS Gönder"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleViewCustomer(customer);
              }}
            >
              View
            </Button>
          </div>
        ),
      },
    ],
    [
      handleViewCustomer,
      setSelectedCustomers,
      setIsDiscountDialogOpen,
      setIsSmsDialogOpen,
      canAssignCoupons,
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
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search customers..."
        view={view}
        onViewChange={setView}
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
