/**
 * Category Card Component
 * Displays a category with its details and actions
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { categoryService } from "@/services";
import type { Category } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CategoryCardProps {
  category: Category;
  storeId: number;
  onEdit: (category: Category) => void;
}

export function CategoryCard({ category, storeId, onEdit }: CategoryCardProps) {
  const queryClient = useQueryClient();

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => categoryService.deleteCategory(storeId, category.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", storeId] });
    },
  });

  // Toggle visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: () =>
      categoryService.updateCategory(storeId, category.id, {
        isVisible: !category.isVisible,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", storeId] });
    },
  });

  const handleDelete = () => {
    if (
      confirm(
        "Are you sure you want to delete this category? Services in this category will not be deleted."
      )
    ) {
      deleteMutation.mutate();
    }
  };

  return (
    <Card className={!category.isVisible ? "opacity-60" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg">{category.name}</CardTitle>
              {!category.isVisible && (
                <Badge variant="secondary" className="text-xs">
                  Hidden
                </Badge>
              )}
            </div>
            {category.description && (
              <CardDescription className="line-clamp-2">
                {category.description}
              </CardDescription>
            )}
          </div>
          {category.color && (
            <div
              className="w-4 h-4 rounded-full ml-2 shrink-0"
              style={{ backgroundColor: category.color }}
              title={category.color}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Icon (if exists) */}
        {category.icon && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Icon:</span> {category.icon}
          </div>
        )}

        {/* Position */}
        <div className="text-xs text-gray-500">
          Position: {category.position}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(category)}
            className="flex-1"
          >
            <Edit className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toggleVisibilityMutation.mutate()}
            disabled={toggleVisibilityMutation.isPending}
          >
            {category.isVisible ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
