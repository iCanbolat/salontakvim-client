/**
 * Service Form Dialog
 * Create or edit a service
 */

import { useEffect, useState } from "react";
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
  DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const serviceSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(1000).optional().or(z.literal("")),
  categoryId: z.string().optional(),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  price: z.number().min(0, "Price cannot be negative"),
  capacity: z
    .number()
    .min(1, "Capacity must be at least 1")
    .max(10, "Maximum capacity is 10"),
  bufferTimeBefore: z.number().min(0).optional(),
  bufferTimeAfter: z.number().min(0).optional(),
  isVisible: z.boolean(),
  showBringingAnyoneOption: z.boolean(),
  allowRecurring: z.boolean(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceFormDialogProps {
  storeId: string;
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
  const [isEditing, setIsEditing] = useState(!!service);

  // Update isEditing only when dialog opens to prevent flickering on close
  useEffect(() => {
    if (open) {
      setIsEditing(!!service);
    }
  }, [open, service]);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["categories", storeId],
    queryFn: () => categoryService.getCategories(storeId),
    enabled: open && !!storeId,
  });

  // Form setup
  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      duration: 60,
      price: 0,
      capacity: 1,
      bufferTimeBefore: 0,
      bufferTimeAfter: 0,
      isVisible: true,
      showBringingAnyoneOption: false,
      allowRecurring: false,
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isDirty },
  } = form;

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
      <DialogContent className="max-w-2xl">
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

        <Form {...form}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0"
          >
            <DialogBody className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">
                  Basic Information
                </h3>

                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Service Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Haircut, Manicure"
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of the service..."
                          rows={3}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category */}
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === "none" ? undefined : value)
                        }
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger className="w-1/2">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No category</SelectItem>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Pricing & Duration */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">
                  Pricing & Duration
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Duration */}
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Duration (minutes){" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Price */}
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Price <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Capacity & Buffer Times */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">
                  Capacity & Scheduling
                </h3>

                <div className="grid grid-cols-3 gap-4">
                  {/* Capacity */}
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Capacity <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Buffer Before */}
                  <FormField
                    control={form.control}
                    name="bufferTimeBefore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Buffer Before (min)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                            value={field.value || 0}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Buffer After */}
                  <FormField
                    control={form.control}
                    name="bufferTimeAfter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Buffer After (min)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                            value={field.value || 0}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Settings</h3>

                {/* Visibility */}
                <FormField
                  control={form.control}
                  name="isVisible"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Visible to customers</FormLabel>
                        <FormDescription>
                          Show this service in the booking widget
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Bring Anyone Option */}
                <FormField
                  control={form.control}
                  name="showBringingAnyoneOption"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Allow bringing anyone</FormLabel>
                        <FormDescription>
                          Customer can bring additional people
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Recurring Appointments */}
                <FormField
                  control={form.control}
                  name="allowRecurring"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Allow recurring appointments</FormLabel>
                        <FormDescription>
                          Enable repeat bookings for this service
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </DialogBody>

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
        </Form>
      </DialogContent>
    </Dialog>
  );
}
