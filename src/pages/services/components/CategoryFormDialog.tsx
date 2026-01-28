/**
 * Category Form Dialog
 * Create or edit a category
 */

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { categoryService } from "@/services";
import type { Category } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  storeId: string;
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
  const [isEditing, setIsEditing] = useState(!!category);

  useEffect(() => {
    if (open) {
      setIsEditing(!!category);
    }
  }, [open, category]);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#3B82F6",
      icon: "",
      isVisible: true,
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isDirty },
  } = form;

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
  }, [category, reset, open]);

  const mutation = useMutation({
    mutationFn: (data: CategoryFormData) => {
      if (isEditing && category) {
        return categoryService.updateCategory(storeId, category.id, data);
      }
      return categoryService.createCategory(storeId, data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", storeId] });
      onClose();
      reset();
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Category" : "Add New Category"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update category details"
              : "Create a new category for your services"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
            <DialogBody className="space-y-4">
              {/* Category Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Haircuts, Consultations"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell customers about this category..."
                        rows={3}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Color & Visibility */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            type="color"
                            className="w-12 h-10 p-1 cursor-pointer"
                            {...field}
                          />
                        </FormControl>
                        <FormControl>
                          <Input
                            type="text"
                            className="flex-1 font-mono uppercase"
                            maxLength={7}
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isVisible"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visible to customers</FormLabel>
                      <div className="flex items-center h-10 gap-3">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <span className="text-sm text-gray-500">
                          {field.value ? "Active" : "Hidden"}
                        </span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </DialogBody>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending || (!isDirty && isEditing)}
              >
                {mutation.isPending ? (
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
        </Form>
      </DialogContent>
    </Dialog>
  );
}
