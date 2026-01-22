/**
 * Customers List Page
 * Main page for viewing and managing customers
 */

import { useMemo, useState, useEffect } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
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
import { usePagination, useDebouncedSearch } from "@/hooks";
import { storeService, customerService } from "@/services";
import type { CustomerWithStats } from "@/types";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CustomerCard, SmsDialog, DiscountDialog } from "@/components/customers";
import {
  PageView,
  TableView,
  type TableColumn,
} from "@/components/common/page-view";

export function CustomersList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isSmsDialogOpen, setIsSmsDialogOpen] = useState(false);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState(false);

  // Determine base path based on current location (admin or staff)
  const basePath = location.pathname.startsWith("/staff")
    ? "/staff/customers"
    : "/admin/customers";

  const debouncedSearch = useDebouncedSearch(searchTerm, {
    minLength: 2,
    delay: 400,
  });

  // Fetch user's store
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
  });

  // Fetch customers
  const {
    data: customers,
    isPending: customersPending,
    error,
  } = useQuery({
    queryKey: ["customers", store?.id, debouncedSearch],
    queryFn: () =>
      customerService.getCustomers(store!.id, {
        search: debouncedSearch || undefined,
      }),
    enabled: !!store?.id,
    placeholderData: keepPreviousData,
  });

  const isInitialLoading = (storeLoading || customersPending) && !customers;

  // Sync search term from URL
  useEffect(() => {
    const initialSearch = searchParams.get("search");
    if (initialSearch && initialSearch !== searchTerm) {
      setSearchTerm(initialSearch);
    }
  }, [searchParams]);

  // Sync URL with search term
  useEffect(() => {
    const current = new URLSearchParams(searchParams);
    if (searchTerm) {
      current.set("search", searchTerm);
    } else {
      current.delete("search");
    }
    const nextSearch = current.toString();
    const prevSearch = searchParams.toString();

    if (nextSearch !== prevSearch) {
      setSearchParams(current, { replace: true });
    }
  }, [searchTerm, setSearchParams, searchParams]);

  // Pagination
  const {
    paginatedItems,
    currentPage,
    totalPages,
    goToPage,
    startIndex,
    endIndex,
  } = usePagination({
    items: customers || [],
    itemsPerPage: 12,
  });

  // Reset to first page on search
  useEffect(() => {
    goToPage(1);
  }, [debouncedSearch]);

  const handleViewCustomer = (customer: CustomerWithStats) => {
    navigate(`${basePath}/${customer.id}`);
  };

  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    setSelectedCustomers((prev) =>
      checked ? [...prev, customerId] : prev.filter((id) => id !== customerId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedCustomers((prev) => {
      if (checked) {
        const nextIds = new Set([...prev, ...paginatedItems.map((c) => c.id)]);
        return Array.from(nextIds);
      }
      // Unselect only the currently visible page
      const currentPageIds = new Set(paginatedItems.map((c) => c.id));
      return prev.filter((id) => !currentPageIds.has(id));
    });
  };

  const handleOpenSmsDialog = () => {
    setIsSmsDialogOpen(true);
  };

  const handleCloseSmsDialog = () => {
    setIsSmsDialogOpen(false);
  };

  const handleOpenDiscountDialog = () => {
    setIsDiscountDialogOpen(true);
  };

  const handleCloseDiscountDialog = () => {
    setIsDiscountDialogOpen(false);
    setSelectedCustomers([]);
  };

  const handleSelectAllCustomers = () => {
    if (!customers) return;
    setSelectedCustomers(customers.map((c) => c.id));
  };

  const handleSendSms = async (message: string) => {
    setIsSendingSms(true);
    try {
      // TODO: Implement SMS sending API call
      console.log("Sending SMS to customers:", selectedCustomers);
      console.log("Message:", message);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Reset state after successful send
      setSelectedCustomers([]);
      handleCloseSmsDialog();
    } catch (error) {
      console.error("Failed to send SMS:", error);
    } finally {
      setIsSendingSms(false);
    }
  };

  const isAllCustomersSelected =
    customers &&
    customers.length > 0 &&
    selectedCustomers.length === customers.length;
  const selectedCustomersData = customers
    ? customers.filter((c) => selectedCustomers.includes(c.id))
    : [];

  // Empty state messages based on search
  const emptyTitle = debouncedSearch
    ? `No customers matching "${debouncedSearch}"`
    : "No customers yet";

  const emptyDescription = debouncedSearch
    ? "Try adjusting your search query"
    : "Customers will appear here when they book appointments";

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
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCustomers([customer.id]);
                handleOpenDiscountDialog();
              }}
              title="İndirim Tanımla"
            >
              <Tag className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCustomers([customer.id]);
                handleOpenSmsDialog();
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
    [handleViewCustomer]
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
          {!isAllCustomersSelected && customers && customers.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAllCustomers}
              className="gap-2"
            >
              Select all {customers.length} customers
            </Button>
          )}
          {selectedCustomers.length > 0 && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={handleOpenDiscountDialog}
                className="gap-2"
              >
                <Tag className="h-4 w-4" />
                İndirim ({selectedCustomers.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenSmsDialog}
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
        data={paginatedItems}
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
        startIndex={paginatedItems.length === 0 ? 0 : startIndex}
        endIndex={paginatedItems.length === 0 ? 0 : endIndex}
        totalItems={customers?.length ?? 0}
        emptyIcon={<Users className="h-12 w-12 text-gray-400 mx-auto" />}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        contentClassName="pt-0"
      />

      <SmsDialog
        isOpen={isSmsDialogOpen}
        onClose={handleCloseSmsDialog}
        selectedCustomers={selectedCustomersData}
        onSend={handleSendSms}
        isSending={isSendingSms}
      />

      <DiscountDialog
        isOpen={isDiscountDialogOpen}
        onClose={handleCloseDiscountDialog}
        selectedCustomers={selectedCustomersData}
        storeId={store.id}
      />
    </div>
  );
}
