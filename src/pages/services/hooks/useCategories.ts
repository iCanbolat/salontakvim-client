/**
 * useCategories Hook
 * Centralizes state and logic for the Categories management.
 */

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { storeService, categoryService } from "@/services";
import { usePagination } from "@/hooks";
import type { Category } from "@/types";

export function useCategories() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");

  // Fetch user's store
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
  });

  // Fetch categories
  const {
    data: categories,
    isLoading: categoriesLoading,
    error,
  } = useQuery({
    queryKey: ["categories", store?.id],
    queryFn: () => categoryService.getCategories(store!.id),
    enabled: !!store?.id,
  });

  const isLoading = storeLoading || categoriesLoading;

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    return (
      categories?.filter(
        (category) =>
          category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          category.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()),
      ) || []
    );
  }, [categories, searchQuery]);

  // Pagination
  const pagination = usePagination({
    items: filteredCategories,
    itemsPerPage: 12,
  });

  // Reset to first page on search
  useEffect(() => {
    pagination.goToPage(1);
  }, [searchQuery]);

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
  };

  const handleCloseDialog = () => {
    setIsCategoryDialogOpen(false);
    setEditingCategory(null);
  };

  return {
    state: {
      searchQuery,
      isCategoryDialogOpen,
      editingCategory,
      view,
      isLoading,
      error,
    },
    actions: {
      setSearchQuery,
      setIsCategoryDialogOpen,
      setEditingCategory,
      setView,
      handleEdit,
      handleCloseDialog,
      goToPage: pagination.goToPage,
    },
    data: {
      store,
      categories: filteredCategories,
      paginatedCategories: pagination.paginatedItems,
      totalCount: filteredCategories.length,
    },
    pagination: {
      currentPage: pagination.currentPage,
      totalPages: pagination.totalPages,
      startIndex: pagination.startIndex,
      endIndex: pagination.endIndex,
    },
  };
}
