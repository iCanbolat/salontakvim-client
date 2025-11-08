/**
 * Staff Profile Dialog Component
 * Form for editing staff member profile information
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { staffService } from "@/services";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { StaffMember, UpdateStaffProfileDto } from "@/types";

const profileSchema = z.object({
  bio: z.string().max(500, "Bio too long").optional(),
  title: z.string().max(255, "Title too long").optional(),
  locationId: z.number().int().positive().optional().nullable(),
  isVisible: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface StaffProfileDialogProps {
  storeId: number;
  staff: StaffMember;
  open: boolean;
  onClose: () => void;
}

export function StaffProfileDialog({
  storeId,
  staff,
  open,
  onClose,
}: StaffProfileDialogProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
    defaultValues: {
      bio: staff.bio || "",
      title: staff.title || "",
      locationId: staff.locationId,
      isVisible: staff.isVisible,
    },
  });

  const isVisible = watch("isVisible");

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateStaffProfileDto) =>
      staffService.updateStaffProfile(storeId, staff.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", storeId] });
      onClose();
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    const updateData: UpdateStaffProfileDto = {
      bio: data.bio || undefined,
      title: data.title || undefined,
      locationId: data.locationId || undefined,
      isVisible: data.isVisible,
    };
    updateMutation.mutate(updateData);
  };

  const handleClose = () => {
    if (!updateMutation.isPending) {
      updateMutation.reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Edit Profile - {staff.firstName} {staff.lastName}
          </DialogTitle>
          <DialogDescription>
            Update staff member profile information and visibility settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={staff.email}
              disabled
              className="bg-gray-50"
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Job Title</Label>
            <Input
              id="title"
              type="text"
              placeholder="e.g. Senior Stylist, Nail Technician"
              {...register("title")}
              disabled={updateMutation.isPending}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell customers about this staff member's experience and specialties..."
              rows={4}
              {...register("bio")}
              disabled={updateMutation.isPending}
            />
            {errors.bio && (
              <p className="text-sm text-red-600">{errors.bio.message}</p>
            )}
          </div>

          {/* Location ID */}
          <div className="space-y-2">
            <Label htmlFor="locationId">Location ID (Optional)</Label>
            <Input
              id="locationId"
              type="number"
              placeholder="Enter location ID"
              {...register("locationId", { valueAsNumber: true })}
              disabled={updateMutation.isPending}
            />
            {errors.locationId && (
              <p className="text-sm text-red-600">
                {errors.locationId.message}
              </p>
            )}
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="visibility">Visible in Booking Widget</Label>
              <p className="text-sm text-gray-600">
                Show this staff member to customers when booking
              </p>
            </div>
            <Switch
              id="visibility"
              checked={isVisible}
              onCheckedChange={(checked: boolean) =>
                setValue("isVisible", checked, { shouldDirty: true })
              }
              disabled={updateMutation.isPending}
            />
          </div>

          {/* Error Alert */}
          {updateMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to update profile. Please try again.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isDirty || updateMutation.isPending}
            >
              {updateMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
