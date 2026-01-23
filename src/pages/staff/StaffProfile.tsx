import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts";
import { staffService, storeService } from "@/services";
import type { UpdateStaffProfileDto } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const profileSchema = z.object({
  bio: z.string().max(500, "Bio too long").optional(),
  title: z.string().max(255, "Title too long").optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function StaffProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
  });

  const {
    data: staffMember,
    isLoading: staffLoading,
    error: staffError,
  } = useQuery({
    queryKey: ["my-staff-member", store?.id, user?.id],
    queryFn: async () => {
      const staffMembers = await staffService.getStaffMembers(store!.id);
      return staffMembers.find((s) => s.userId === user?.id) ?? null;
    },
    enabled: !!store?.id && !!user?.id,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
    defaultValues: {
      bio: staffMember?.bio || "",
      title: staffMember?.title || "",
    },
  });

  // Sync form defaults when staff data loads
  useEffect(() => {
    if (staffMember) {
      reset({
        bio: staffMember.bio || "",
        title: staffMember.title || "",
      });
    }
  }, [staffMember, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateStaffProfileDto) =>
      staffService.updateStaffProfile(store!.id, staffMember!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", store?.id] });
      queryClient.invalidateQueries({
        queryKey: ["my-staff-member", store?.id, user?.id],
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: UpdateStaffProfileDto) =>
      staffService.createSelfStaffProfile(store!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", store?.id] });
      queryClient.invalidateQueries({
        queryKey: ["my-staff-member", store?.id, user?.id],
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    if (!store) return;
    const payload: UpdateStaffProfileDto = {
      bio: data.bio || undefined,
      title: data.title || undefined,
    };

    if (staffMember) {
      updateMutation.mutate(payload);
      return;
    }

    if (user?.role === "admin") {
      createMutation.mutate(payload);
    }
  };

  const isLoading = storeLoading || staffLoading;

  const displayName = useMemo(() => {
    if (staffMember) {
      return (
        `${staffMember.firstName ?? ""} ${staffMember.lastName ?? ""}`.trim() ||
        "N/A"
      );
    }

    return `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "N/A";
  }, [staffMember, user?.firstName, user?.lastName]);

  const displayEmail = staffMember?.email ?? user?.email ?? "";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!staffMember && user?.role !== "admin") {
    return (
      <Alert variant="destructive">
        <AlertDescription>Staff record not found.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">
            Update your professional profile and bio.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            disabled={
              !isDirty || updateMutation.isPending || createMutation.isPending
            }
            onClick={() => reset()}
          >
            Reset
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={
              !isDirty || updateMutation.isPending || createMutation.isPending
            }
          >
            {(updateMutation.isPending || createMutation.isPending) && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {staffMember ? "Save changes" : "Create staff profile"}
          </Button>
        </div>
      </div>

      {staffError && (
        <Alert variant="destructive">
          <AlertDescription>
            {staffError.message || "Something went wrong"}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Basic Info</CardTitle>
            <CardDescription>Account information (read-only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={displayName} disabled className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={displayEmail} disabled className="bg-gray-50" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Professional Details</CardTitle>
            <CardDescription>Share your role and experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                placeholder="e.g. Senior Stylist, Nail Technician"
                {...register("title")}
                disabled={updateMutation.isPending}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={4}
                placeholder="Tell customers about your expertise and specialties..."
                {...register("bio")}
                disabled={updateMutation.isPending}
              />
              {errors.bio && (
                <p className="text-sm text-red-600">{errors.bio.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {(updateMutation.isError || createMutation.isError) && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to update profile. Please try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
