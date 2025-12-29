/**
 * PageView Component
 * A reusable component for displaying data in grid or list (table) view
 * with search, filters, date range picker, and pagination support.
 */

import type { ReactNode } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaginationControls } from "@/components/common/PaginationControls";
import { ViewToggle } from "../ViewToggle";

export type FilterTab<T extends string = string> = {
  value: T;
  label: string;
  count?: number;
};

export type PageViewProps<TData, TFilter extends string = string> = {
  // Data
  data: TData[];

  // Search
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  // View Toggle
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
  hideViewToggle?: boolean;

  // Date Range (optional)
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  pendingDateRange?: DateRange;
  onPendingDateRangeChange?: (range: DateRange | undefined) => void;
  isDatePopoverOpen?: boolean;
  onDatePopoverOpenChange?: (open: boolean) => void;
  showDatePicker?: boolean;

  // Filter Tabs (optional)
  filterTabs?: FilterTab<TFilter>[];
  activeFilter?: TFilter;
  onFilterChange?: (filter: TFilter) => void;

  // Grid View
  renderGridItem: (item: TData, index: number) => ReactNode;
  gridClassName?: string;
  /** Optional override for grid column min width (e.g. "md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]") */
  gridMinColumnClassName?: string;
  /** Optional override for grid min-height when paginated */
  gridMinHeightClassName?: string;

  // Table/List View
  renderTableView?: (data: TData[]) => ReactNode;

  // Pagination
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  startIndex: number;
  endIndex: number;
  totalItems: number;

  // Empty State
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;

  // Card wrapper
  cardClassName?: string;
  headerClassName?: string;
  contentClassName?: string;

  // Additional header content (right side)
  headerActions?: ReactNode;
};

export function PageView<TData, TFilter extends string = string>({
  data,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  view,
  onViewChange,
  hideViewToggle = false,
  dateRange,
  onDateRangeChange,
  pendingDateRange,
  onPendingDateRangeChange,
  isDatePopoverOpen,
  onDatePopoverOpenChange,
  showDatePicker = false,
  filterTabs,
  activeFilter,
  onFilterChange,
  renderGridItem,
  gridClassName,
  gridMinColumnClassName,
  gridMinHeightClassName,
  renderTableView,
  currentPage,
  totalPages,
  onPageChange,
  startIndex,
  endIndex,
  totalItems,
  emptyIcon,
  emptyTitle = "No items found",
  emptyDescription = "Try adjusting your search or filters",
  emptyAction,
  cardClassName,
  headerClassName,
  contentClassName,
  headerActions,
}: PageViewProps<TData, TFilter>) {
  const handleApplyDateRange = () => {
    onDateRangeChange?.(pendingDateRange);
    onDatePopoverOpenChange?.(false);
  };

  const handleClearDateRange = () => {
    onDateRangeChange?.(undefined);
    onPendingDateRangeChange?.(undefined);
  };

  const handleDatePopoverChange = (open: boolean) => {
    onDatePopoverOpenChange?.(open);
    if (open) {
      onPendingDateRangeChange?.(dateRange);
    } else {
      onPendingDateRangeChange?.(undefined);
    }
  };

  const renderContent = () => {
    if (data.length === 0) {
      return (
        <div className="text-center py-12">
          {emptyIcon && (
            <div className="flex justify-center mb-4">{emptyIcon}</div>
          )}
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {emptyTitle}
          </h3>
          <p className="text-gray-600 mb-4">{emptyDescription}</p>
          {emptyAction}
        </div>
      );
    }

    return (
      <div
        className={cn(
          "flex flex-col",
          view === "grid" &&
            totalPages > 1 &&
            (gridMinHeightClassName ?? "min-h-[850px]"),
          view === "list" && "h-full"
        )}
      >
        {view === "list" && renderTableView ? (
          renderTableView(data)
        ) : (
          <div
            className={cn(
              "grid grid-cols-1 gap-4 items-stretch transition-all duration-300",
              gridMinColumnClassName ??
                "md:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]",
              gridClassName
            )}
          >
            {data.map((item, index) => renderGridItem(item, index))}
          </div>
        )}
        <div className="mt-auto pt-4">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            canGoPrevious={currentPage > 1}
            canGoNext={currentPage < totalPages}
            startIndex={startIndex}
            endIndex={endIndex}
            totalItems={totalItems}
          />
        </div>
      </div>
    );
  };

  const mainContent = filterTabs ? (
    <Tabs
      value={activeFilter}
      onValueChange={(v) => onFilterChange?.(v as TFilter)}
      className={cn(view === "list" && "h-full")}
    >
      <div className="overflow-x-auto -mx-2 px-2 mb-4">
        <TabsList className="inline-flex w-auto min-w-full">
          {filterTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="whitespace-nowrap"
            >
              {tab.label}
              {tab.count !== undefined && ` (${tab.count})`}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <TabsContent
        value={activeFilter!}
        className={cn(view === "list" && "h-full")}
      >
        {renderContent()}
      </TabsContent>
    </Tabs>
  ) : (
    renderContent()
  );

  return (
    <Card className={cn(view === "list" && "h-full", cardClassName)}>
      <CardHeader
        className={cn(
          "flex flex-col gap-4 mb-4 md:flex-row md:items-center md:justify-between",
          headerClassName
        )}
      >
        {/* Search */}
        {onSearchChange && (
          <div className="w-full md:w-64">
            <SearchInput
              value={searchValue ?? ""}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
              className="w-full"
            />
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          {/* Date Range Picker */}
          {showDatePicker && onDateRangeChange && (
            <div className="flex w-full md:w-auto">
              <Popover
                open={isDatePopoverOpen}
                onOpenChange={handleDatePopoverChange}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant={dateRange?.from ? "secondary" : "outline"}
                    size="lg"
                    className={cn(
                      "justify-start gap-2 text-left font-normal relative",
                      dateRange?.from
                        ? "w-full md:w-[calc(15rem-2.25rem)] border"
                        : "w-full md:w-60"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 shrink-0" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd")} -{" "}
                          {format(dateRange.to, "LLL dd")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                    {dateRange?.from && (
                      <Button
                        variant={dateRange?.from ? "secondary" : "ghost"}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearDateRange();
                        }}
                        className="absolute right-1 top-1 border-none border-b w-7 h-7 hover:bg-primary/50 rounded-4xl focus:ring-0"
                      >
                        <X />
                      </Button>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    defaultMonth={(pendingDateRange ?? dateRange)?.from}
                    selected={pendingDateRange ?? dateRange}
                    onSelect={onPendingDateRangeChange}
                  />
                  <div className="flex items-center gap-2 border-t p-3">
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={handleApplyDateRange}
                      disabled={!pendingDateRange?.from && !dateRange?.from}
                    >
                      Apply
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* View Toggle */}
          {!hideViewToggle && (
            <ViewToggle
              view={view}
              onChange={onViewChange}
              className="hidden md:flex"
            />
          )}

          {/* Additional Header Actions */}
          {headerActions}
        </div>
      </CardHeader>

      <CardContent
        className={cn(view === "list" && "h-full", contentClassName)}
      >
        {mainContent}
      </CardContent>
    </Card>
  );
}
