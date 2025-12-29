/**
 * TableView Component
 * A reusable table component for displaying data in list view format.
 */

import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type TableColumn<TData> = {
  /** Unique key for the column */
  key: string;
  /** Column header label */
  header: string;
  /** Render function for the cell content */
  render: (item: TData, index: number) => ReactNode;
  /** Optional CSS class for header */
  headerClassName?: string;
  /** Optional CSS class for cells */
  cellClassName?: string;
  /** Hide column on certain breakpoints */
  hideOnMobile?: boolean;
  /** Hide column on tablet */
  hideOnTablet?: boolean;
};

export type TableViewProps<TData> = {
  /** Data to display in the table */
  data: TData[];
  /** Column definitions */
  columns: TableColumn<TData>[];
  /** Unique key getter for each row */
  getRowKey: (item: TData, index: number) => string;
  /** Optional click handler for row */
  onRowClick?: (item: TData) => void;
  /** Optional class name for the table container */
  className?: string;
  /** Optional class name for table rows */
  rowClassName?: string | ((item: TData, index: number) => string);
  /** Enable checkbox selection column */
  enableSelection?: boolean;
  /** Selected row keys (controlled) */
  selectedKeys?: Set<string> | string[];
  /** Toggle a single row selection */
  onToggleRow?: (key: string, item: TData, checked: boolean) => void;
  /** Toggle all rows selection */
  onToggleAll?: (checked: boolean) => void;
};

export function TableView<TData>({
  data,
  columns,
  getRowKey,
  onRowClick,
  className,
  rowClassName,
  enableSelection = false,
  selectedKeys,
  onToggleRow,
  onToggleAll,
}: TableViewProps<TData>) {
  const getResponsiveClass = (column: TableColumn<TData>) => {
    if (column.hideOnMobile && column.hideOnTablet) {
      return "hidden lg:table-cell";
    }
    if (column.hideOnMobile) {
      return "hidden md:table-cell";
    }
    if (column.hideOnTablet) {
      return "hidden lg:table-cell";
    }
    return "";
  };

  const getRowClassName = (item: TData, index: number) => {
    const base = "hover:bg-muted/50 transition-colors";
    const clickable = onRowClick ? "cursor-pointer" : "";
    const custom =
      typeof rowClassName === "function"
        ? rowClassName(item, index)
        : rowClassName || "";
    return `${base} ${clickable} ${custom}`.trim();
  };

  const isSelected = (key: string) => {
    if (!selectedKeys) return false;
    return Array.isArray(selectedKeys)
      ? selectedKeys.includes(key)
      : selectedKeys.has(key);
  };

  const allSelected = enableSelection
    ? data.length > 0 &&
      data.every((item, index) => isSelected(getRowKey(item, index)))
    : false;

  const someSelected = enableSelection
    ? data.some((item, index) => isSelected(getRowKey(item, index))) &&
      !allSelected
    : false;

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            {enableSelection && (
              <TableHead className="w-10">
                <Checkbox
                  checked={someSelected ? "indeterminate" : allSelected}
                  onCheckedChange={(checked) => onToggleAll?.(!!checked)}
                  aria-label="Select all rows"
                  className="translate-y-0.5"
                  onClick={(e) => e.stopPropagation()}
                />
              </TableHead>
            )}
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={`${
                  column.headerClassName || ""
                } ${getResponsiveClass(column)}`.trim()}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow
              key={getRowKey(item, index)}
              className={getRowClassName(item, index)}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
            >
              {enableSelection && (
                <TableCell className="w-10">
                  <Checkbox
                    checked={isSelected(getRowKey(item, index))}
                    onCheckedChange={(checked) => {
                      onToggleRow?.(getRowKey(item, index), item, !!checked);
                    }}
                    aria-label="Select row"
                    className="translate-y-0.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={`${
                    column.cellClassName || ""
                  } ${getResponsiveClass(column)}`.trim()}
                >
                  {column.render(item, index)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
