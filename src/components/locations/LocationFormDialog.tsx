/**
 * Location Form Dialog
 * Create or edit a location
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { locationService } from "@/services";
import type { Location, CreateLocationDto } from "@/types";
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
import { Switch } from "@/components/ui/switch";

const locationSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  address: z.string().max(500).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  state: z.string().max(100).optional().or(z.literal("")),
  zipCode: z.string().max(20).optional().or(z.literal("")),
  country: z.string().max(100).optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  email: z
    .string()
    .email("Invalid email address")
    .max(255)
    .optional()
    .or(z.literal("")),
  latitude: z.string().max(50).optional().or(z.literal("")),
  longitude: z.string().max(50).optional().or(z.literal("")),
  isVisible: z.boolean(),
});

type LocationFormData = z.infer<typeof locationSchema>;

interface LocationFormDialogProps {
  storeId: number;
  location?: Location | null;
  open: boolean;
  onClose: () => void;
}

export function LocationFormDialog({
  storeId,
  location,
  open,
  onClose,
}: LocationFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!location;

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      phone: "",
      email: "",
      latitude: "",
      longitude: "",
      isVisible: true,
    },
  });

  // Watch form values for controlled components
  const isVisible = watch("isVisible");

  // Reset form when location changes
  useEffect(() => {
    if (location) {
      reset({
        name: location.name,
        address: location.address || "",
        city: location.city || "",
        state: location.state || "",
        zipCode: location.zipCode || "",
        country: location.country || "",
        phone: location.phone || "",
        email: location.email || "",
        latitude: location.latitude || "",
        longitude: location.longitude || "",
        isVisible: location.isVisible,
      });
    } else {
      reset({
        name: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        phone: "",
        email: "",
        latitude: "",
        longitude: "",
        isVisible: true,
      });
    }
  }, [location, reset]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateLocationDto) =>
      locationService.createLocation(storeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations", storeId] });
      onClose();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: CreateLocationDto) =>
      locationService.updateLocation(storeId, location!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations", storeId] });
      onClose();
    },
  });

  const onSubmit = (data: LocationFormData) => {
    const locationData: CreateLocationDto = {
      name: data.name,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      zipCode: data.zipCode || undefined,
      country: data.country || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      latitude: data.latitude || undefined,
      longitude: data.longitude || undefined,
      isVisible: data.isVisible,
    };

    if (isEditing) {
      updateMutation.mutate(locationData);
    } else {
      createMutation.mutate(locationData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Location" : "Create New Location"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update location details"
              : "Add a new location/branch for your business"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Location Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., Downtown Branch, Main Office"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              {...register("address")}
              placeholder="e.g., 123 Main Street"
            />
            {errors.address && (
              <p className="text-sm text-red-600">{errors.address.message}</p>
            )}
          </div>

          {/* City, State, Zip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                {...register("city")}
                placeholder="e.g., New York"
              />
              {errors.city && (
                <p className="text-sm text-red-600">{errors.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input id="state" {...register("state")} placeholder="e.g., NY" />
              {errors.state && (
                <p className="text-sm text-red-600">{errors.state.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">Zip Code</Label>
              <Input
                id="zipCode"
                {...register("zipCode")}
                placeholder="e.g., 10001"
              />
              {errors.zipCode && (
                <p className="text-sm text-red-600">{errors.zipCode.message}</p>
              )}
            </div>
          </div>

          {/* Country */}
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              {...register("country")}
              placeholder="e.g., United States"
            />
            {errors.country && (
              <p className="text-sm text-red-600">{errors.country.message}</p>
            )}
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="e.g., +1 (555) 123-4567"
              />
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="e.g., contact@location.com"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Coordinates (Optional) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude (optional)</Label>
              <Input
                id="latitude"
                {...register("latitude")}
                placeholder="e.g., 40.7128"
              />
              {errors.latitude && (
                <p className="text-sm text-red-600">
                  {errors.latitude.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude (optional)</Label>
              <Input
                id="longitude"
                {...register("longitude")}
                placeholder="e.g., -74.0060"
              />
              {errors.longitude && (
                <p className="text-sm text-red-600">
                  {errors.longitude.message}
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Coordinates are used for map integration (if applicable)
          </p>

          {/* Visibility */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Visible to customers</Label>
              <p className="text-sm text-gray-500">
                Show this location in the booking widget
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
                "Update Location"
              ) : (
                "Create Location"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
