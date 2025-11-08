/**
 * Category Form Dialog
 * Create or edit a category
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { categoryService } from "@/services";
import type { Category, CreateCategoryDto } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(1000).optional().or(z.literal("")),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color")
    .optional()
    .or(z.literal("")),
  icon: z.string().max(50).optional().or(z.literal("")),
  isVisible: z.boolean(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormDialogProps {
  storeId: number;
  category?: Category | null;
  open: boolean;
  onClose: () => void;
}

export function CategoryFormDialog({
  storeId,
  category,
  open,
  onClose,
}: CategoryFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!category;

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#3B82F6",
      icon: "",
      isVisible: true,
    },
  });

  // Watch form values for controlled components
  const isVisible = watch("isVisible");

  // Reset form when category changes
  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        description: category.description || "",
        color: category.color || "#3B82F6",
        icon: category.icon || "",
        isVisible: category.isVisible,
      });
    } else {
      reset({
        name: "",
        description: "",
        color: "#3B82F6",
        icon: "",
        isVisible: true,
      });
    }
  }, [category, reset]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateCategoryDto) =>
      categoryService.createCategory(storeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", storeId] });
      onClose();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: CreateCategoryDto) =>
      categoryService.updateCategory(storeId, category!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", storeId] });
      onClose();
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    const categoryData: CreateCategoryDto = {
      name: data.name,
      description: data.description || undefined,
      color: data.color || undefined,
      icon: data.icon || undefined,
      isVisible: data.isVisible,
    };

    if (isEditing) {
      updateMutation.mutate(categoryData);
    } else {
      createMutation.mutate(categoryData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Category" : "Create New Category"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update category details"
              : "Add a new category to organize your services"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Category Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., Hair Services, Nail Care"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Brief description of the category..."
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex items-center gap-3">
              <Input
                id="color"
                type="color"
                {...register("color")}
                className="w-20 h-10"
              />
              <Input
                {...register("color")}
                placeholder="#3B82F6"
                className="flex-1"
              />
            </div>
            {errors.color && (
              <p className="text-sm text-red-600">{errors.color.message}</p>
            )}
          </div>

          {/* Icon */}
          <div className="space-y-2">
            <Label htmlFor="icon">Icon (optional)</Label>
            <Input
              id="icon"
              {...register("icon")}
              placeholder="e.g., scissors, palette"
              maxLength={50}
            />
            {errors.icon && (
              <p className="text-sm text-red-600">{errors.icon.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Icon name or emoji (for display purposes)
            </p>
          </div>

          {/* Visibility */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Visible to customers</Label>
              <p className="text-sm text-gray-500">
                Show this category in the booking widget
              </p>
            </div>
            <Switch
              checked={isVisible}
              onCheckedChange={(checked) =>
                setValue("isVisible", checked, { shouldDirty: true })
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isDirty || isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Update Category"
              ) : (
                "Create Category"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
