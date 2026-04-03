/**
 * Category Card Component
 * Displays a category with its details and actions
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { categoryService } from "@/services";
import type { Category } from "@/types";
import { qk } from "@/lib/query-keys";
import { EntityCard } from "@/components/common/EntityCard";
import { useConfirmDialog } from "@/contexts/ConfirmDialogProvider";

interface CategoryCardProps {
  category: Category;
  storeId: string;
  onEdit: (category: Category) => void;
}

export function CategoryCard({ category, storeId, onEdit }: CategoryCardProps) {
  const queryClient = useQueryClient();
  const { confirm } = useConfirmDialog();

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => categoryService.deleteCategory(storeId, category.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.categories(storeId) });
    },
  });

  // Toggle visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: () =>
      categoryService.updateCategory(storeId, category.id, {
        isVisible: !category.isVisible,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.categories(storeId) });
    },
  });

  const handleDelete = () => {
    void confirm({
      title: "Delete category",
      description: "Are you sure you want to delete this category?",
      confirmText: "Delete",
      variant: "destructive",
    }).then((isConfirmed) => {
      if (isConfirmed) {
        deleteMutation.mutate();
      }
    });
  };

  return (
    <EntityCard
      title={category.name}
      description={category.description}
      color={category.color}
      isVisible={category.isVisible}
      onEdit={() => onEdit(category)}
      onToggleVisibility={() => toggleVisibilityMutation.mutate()}
      onDelete={handleDelete}
      isToggling={toggleVisibilityMutation.isPending}
      isDeleting={deleteMutation.isPending}
      toggleTitle={category.isVisible ? "Hide Category" : "Show Category"}
      deleteTitle="Delete Category"
    />
  );
}
