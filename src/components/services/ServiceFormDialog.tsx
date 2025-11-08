/**
 * Service Form Dialog
 * Create or edit a service
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { serviceService, categoryService } from "@/services";
import type { Service, CreateServiceDto } from "@/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const serviceSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(1000).optional().or(z.literal("")),
  categoryId: z.number().optional(),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  price: z.number().min(0, "Price cannot be negative"),
  capacity: z
    .number()
    .min(1, "Capacity must be at least 1")
    .max(10, "Maximum capacity is 10"),
  bufferTimeBefore: z.number().min(0).optional(),
  bufferTimeAfter: z.number().min(0).optional(),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color")
    .optional()
    .or(z.literal("")),
  isVisible: z.boolean(),
  showBringingAnyoneOption: z.boolean(),
  allowRecurring: z.boolean(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceFormDialogProps {
  storeId: number;
  service?: Service | null;
  open: boolean;
  onClose: () => void;
}

export function ServiceFormDialog({
  storeId,
  service,
  open,
  onClose,
}: ServiceFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!service;

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["categories", storeId],
    queryFn: () => categoryService.getCategories(storeId),
    enabled: open && !!storeId,
  });

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      duration: 60,
      price: 0,
      capacity: 1,
      bufferTimeBefore: 0,
      bufferTimeAfter: 0,
      color: "#3B82F6",
      isVisible: true,
      showBringingAnyoneOption: false,
      allowRecurring: false,
    },
  });

  // Watch form values for controlled components
  const isVisible = watch("isVisible");
  const showBringingAnyoneOption = watch("showBringingAnyoneOption");
  const allowRecurring = watch("allowRecurring");
  const categoryId = watch("categoryId");

  // Reset form when service changes
  useEffect(() => {
    if (service) {
      reset({
        name: service.name,
        description: service.description || "",
        categoryId: service.categoryId,
        duration: service.duration,
        price: parseFloat(service.price),
        capacity: service.capacity,
        bufferTimeBefore: service.bufferTimeBefore,
        bufferTimeAfter: service.bufferTimeAfter,
        color: service.color || "#3B82F6",
        isVisible: service.isVisible,
        showBringingAnyoneOption: service.showBringingAnyoneOption,
        allowRecurring: service.allowRecurring,
      });
    } else {
      reset({
        name: "",
        description: "",
        duration: 60,
        price: 0,
        capacity: 1,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
        color: "#3B82F6",
        isVisible: true,
        showBringingAnyoneOption: false,
        allowRecurring: false,
      });
    }
  }, [service, reset]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateServiceDto) =>
      serviceService.createService(storeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", storeId] });
      onClose();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: CreateServiceDto) =>
      serviceService.updateService(storeId, service!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", storeId] });
      onClose();
    },
  });

  const onSubmit = (data: ServiceFormData) => {
    const serviceData: CreateServiceDto = {
      name: data.name,
      description: data.description || undefined,
      categoryId: data.categoryId || undefined,
      duration: data.duration,
      price: data.price,
      capacity: data.capacity,
      bufferTimeBefore: data.bufferTimeBefore || 0,
      bufferTimeAfter: data.bufferTimeAfter || 0,
      color: data.color || undefined,
      isVisible: data.isVisible,
      showBringingAnyoneOption: data.showBringingAnyoneOption,
      allowRecurring: data.allowRecurring,
    };

    if (isEditing) {
      updateMutation.mutate(serviceData);
    } else {
      createMutation.mutate(serviceData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Service" : "Create New Service"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update service details and settings"
              : "Add a new service to your offerings"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">
              Basic Information
            </h3>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Service Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="e.g., Haircut, Manicure"
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
                placeholder="Brief description of the service..."
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <Select
                value={categoryId?.toString() || "none"}
                onValueChange={(value) =>
                  setValue(
                    "categoryId",
                    value === "none" ? undefined : parseInt(value),
                    { shouldDirty: true }
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pricing & Duration */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">
              Pricing & Duration
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">
                  Duration (minutes) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="duration"
                  type="number"
                  {...register("duration", { valueAsNumber: true })}
                  min="1"
                />
                {errors.duration && (
                  <p className="text-sm text-red-600">
                    {errors.duration.message}
                  </p>
                )}
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">
                  Price <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...register("price", { valueAsNumber: true })}
                  min="0"
                />
                {errors.price && (
                  <p className="text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Capacity & Buffer Times */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">
              Capacity & Scheduling
            </h3>

            <div className="grid grid-cols-3 gap-4">
              {/* Capacity */}
              <div className="space-y-2">
                <Label htmlFor="capacity">
                  Capacity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  {...register("capacity", { valueAsNumber: true })}
                  min="1"
                  max="10"
                />
                {errors.capacity && (
                  <p className="text-sm text-red-600">
                    {errors.capacity.message}
                  </p>
                )}
              </div>

              {/* Buffer Before */}
              <div className="space-y-2">
                <Label htmlFor="bufferTimeBefore">Buffer Before (min)</Label>
                <Input
                  id="bufferTimeBefore"
                  type="number"
                  {...register("bufferTimeBefore", { valueAsNumber: true })}
                  min="0"
                />
              </div>

              {/* Buffer After */}
              <div className="space-y-2">
                <Label htmlFor="bufferTimeAfter">Buffer After (min)</Label>
                <Input
                  id="bufferTimeAfter"
                  type="number"
                  {...register("bufferTimeAfter", { valueAsNumber: true })}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Appearance</h3>

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
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Settings</h3>

            {/* Visibility */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Visible to customers</Label>
                <p className="text-sm text-gray-500">
                  Show this service in the booking widget
                </p>
              </div>
              <Switch
                checked={isVisible}
                onCheckedChange={(checked) =>
                  setValue("isVisible", checked, { shouldDirty: true })
                }
              />
            </div>

            {/* Bring Anyone Option */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Allow bringing anyone</Label>
                <p className="text-sm text-gray-500">
                  Customer can bring additional people
                </p>
              </div>
              <Switch
                checked={showBringingAnyoneOption}
                onCheckedChange={(checked) =>
                  setValue("showBringingAnyoneOption", checked, {
                    shouldDirty: true,
                  })
                }
              />
            </div>

            {/* Recurring Appointments */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Allow recurring appointments</Label>
                <p className="text-sm text-gray-500">
                  Enable repeat bookings for this service
                </p>
              </div>
              <Switch
                checked={allowRecurring}
                onCheckedChange={(checked) =>
                  setValue("allowRecurring", checked, { shouldDirty: true })
                }
              />
            </div>
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
                "Update Service"
              ) : (
                "Create Service"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
