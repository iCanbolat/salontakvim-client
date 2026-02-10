/**
 * usePagination Hook
 * Reusable pagination logic for list pages
 */

import { useMemo, useState, useEffect } from "react";

interface UsePaginationProps<T> {
  items: T[];
  itemsPerPage?: number;
  totalItems?: number;
  disableSlice?: boolean;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  paginatedItems: T[];
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  startIndex: number;
  endIndex: number;
}

export function usePagination<T>({
  items,
  itemsPerPage = 12,
  totalItems,
  disableSlice = false,
  currentPage,
  onPageChange,
}: UsePaginationProps<T>): UsePaginationReturn<T> {
  const [internalPage, setInternalPage] = useState(currentPage ?? 1);
  const effectivePage = currentPage ?? internalPage;
  const setPage = onPageChange ?? setInternalPage;
  const totalCount = totalItems ?? items.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const paginatedItems = useMemo(() => {
    if (disableSlice) {
      return items;
    }

    const startIndex = (effectivePage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, effectivePage, itemsPerPage, disableSlice]);

  const goToPage = (page: number) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setPage(pageNumber);
  };

  const nextPage = () => {
    if (effectivePage < totalPages) {
      setPage(effectivePage + 1);
    }
  };

  const previousPage = () => {
    if (effectivePage > 1) {
      setPage(effectivePage - 1);
    }
  };

  useEffect(() => {
    if (totalPages > 0 && effectivePage > totalPages) {
      setPage(totalPages);
    }
  }, [effectivePage, totalPages, setPage]);

  const startIndex =
    totalCount === 0 ? 0 : (effectivePage - 1) * itemsPerPage + 1;
  const endIndex =
    totalCount === 0 ? 0 : Math.min(effectivePage * itemsPerPage, totalCount);

  return {
    currentPage: effectivePage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    previousPage,
    canGoNext: effectivePage < totalPages,
    canGoPrevious: effectivePage > 1,
    startIndex,
    endIndex,
  };
}
