/**
 * Staff Profile Dialog Component
 * Form for editing staff member profile information
 */

import { useForm, type SubmitHandler } from "react-hook-form";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { staffService, locationService } from "@/services";
import { useAuth } from "@/contexts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import type { StaffMember, UpdateStaffProfileDto } from "@/types";

const profileSchema = z.object({
  bio: z.string().max(500, "Bio too long").optional(),
  title: z.string().max(255, "Title too long").optional(),
  locationId: z.string().optional().nullable(),
  isVisible: z.boolean(),
  role: z.enum(["admin", "manager", "staff"] as const),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface StaffProfileDialogProps {
  storeId: string;
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
  const { user } = useAuth();
  const isManager = user?.role === "manager";
  const [staffSnapshot, setStaffSnapshot] = useState(staff);

  // Update staff snapshot only when dialog opens to prevent flickering on close
  useEffect(() => {
    if (open) {
      setStaffSnapshot(staff);
    }
  }, [open, staff]);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
    defaultValues: {
      bio: staff.bio || "",
      title: staff.title || "",
      locationId: staff.locationId ?? null,
      isVisible: staff.isVisible,
      role: staff.role as "admin" | "manager" | "staff",
    },
  });

  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ["locations", storeId],
    queryFn: () => locationService.getLocations(storeId),
    enabled: open && !isManager,
    staleTime: 1000 * 60 * 5,
  });

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateStaffProfileDto) =>
      staffService.updateStaffProfile(storeId, staff.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", storeId] });
      queryClient.invalidateQueries({
        queryKey: ["staff-member", storeId, staff.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["staff-details", storeId, staff.id],
      });
      toast.success("Profile updated", {
        description: "Staff member profile has been updated successfully.",
      });
      onClose();
    },
  });

  const onSubmit: SubmitHandler<ProfileFormData> = (data) => {
    const updateData: UpdateStaffProfileDto = {
      bio: data.bio || undefined,
      title: data.title || undefined,
      locationId: data.locationId || undefined,
      isVisible: data.isVisible,
      role: data.role,
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
            Edit Profile - {staffSnapshot.firstName} {staffSnapshot.lastName}
          </DialogTitle>
          <DialogDescription>
            Update staff member profile information and visibility settings.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0"
          >
            <DialogBody className="space-y-4">
              {/* Email (Read-only) */}
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    value={staffSnapshot.email}
                    disabled
                    className="bg-gray-50"
                  />
                </FormControl>
              </FormItem>

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Senior Stylist, Nail Technician"
                        {...field}
                        value={field.value || ""}
                        disabled={updateMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bio */}
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell customers about this staff member's experience and specialties..."
                        rows={4}
                        {...field}
                        value={field.value || ""}
                        disabled={updateMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location Selection - Hidden for managers */}
              {!isManager && (
                <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "none"}
                        disabled={updateMutation.isPending || locationsLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No location</SelectItem>
                          {locations?.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose which branch this staff member belongs to.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Visibility Toggle */}
              <FormField
                control={form.control}
                name="isVisible"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Visible in Booking Widget
                      </FormLabel>
                      <FormDescription>
                        Show this staff member to customers when booking
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={updateMutation.isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Role Selection */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={updateMutation.isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="staff">
                          Staff (Limited Access)
                        </SelectItem>
                        <SelectItem value="manager">
                          Manager (Location-based Full Access)
                        </SelectItem>
                        {!isManager && (
                          <SelectItem value="admin">
                            Admin (Full System Access)
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Determines the staff member's access level in the system.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Error Alert */}
              {updateMutation.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Failed to update profile. Please try again.
                  </AlertDescription>
                </Alert>
              )}
            </DialogBody>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 px-6 pb-4">
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
                disabled={!form.formState.isDirty || updateMutation.isPending}
              >
                {updateMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
