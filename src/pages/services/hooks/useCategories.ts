/**
 * useCategories Hook
 * Centralizes state and logic for the Categories management.
 */

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoryService } from "@/services";
import { usePagination, useCurrentStore } from "@/hooks";
import type { Category } from "@/types";
import { toast } from "sonner";

export function useCategories() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { store, isLoading: storeLoading } = useCurrentStore();

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

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (categoryId: string) =>
      categoryService.deleteCategory(store!.id, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", store?.id] });
      toast.success("Category deleted");
    },
    onError: () => {
      toast.error("Failed to delete category");
    },
  });

  // Toggle visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: ({
      categoryId,
      isVisible,
    }: {
      categoryId: string;
      isVisible: boolean;
    }) => categoryService.updateCategory(store!.id, categoryId, { isVisible }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", store?.id] });
      toast.success("Category visibility updated");
    },
    onError: () => {
      toast.error("Failed to update category visibility");
    },
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

  const handleToggleVisibility = (category: Category) => {
    toggleVisibilityMutation.mutate({
      categoryId: category.id,
      isVisible: !category.isVisible,
    });
  };

  const handleDelete = (category: Category) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${category.name}"? This will also remove categories from its services.`,
      )
    ) {
      deleteMutation.mutate(category.id);
    }
  };

  return {
    state: {
      searchQuery,
      isCategoryDialogOpen,
      editingCategory,
      isLoading,
      error,
    },
    actions: {
      setSearchQuery,
      setIsCategoryDialogOpen,
      setEditingCategory,
      handleEdit,
      handleCloseDialog,
      handleToggleVisibility,
      handleDelete,
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
