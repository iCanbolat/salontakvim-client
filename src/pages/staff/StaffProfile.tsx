import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const { user, refetchUser } = useAuth();
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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
      toast.success("Profile updated", {
        description: "Your profile changes have been saved.",
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
      toast.success("Profile created", {
        description: "Your staff profile has been created.",
      });
    },
  });

  const avatarMutation = useMutation({
    mutationFn: async (file: File) =>
      staffService.uploadStaffAvatar(store!.id, staffMember!.id, file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["staff", store?.id] });
      queryClient.invalidateQueries({
        queryKey: ["my-staff-member", store?.id, user?.id],
      });

      if (data?.avatarUrl && staffMember) {
        queryClient.setQueryData(
          ["my-staff-member", store?.id, user?.id],
          (previous: typeof staffMember | null | undefined) =>
            previous ? { ...previous, avatar: data.avatarUrl } : previous,
        );
        queryClient.setQueryData(
          ["staff-member", store?.id, staffMember.id],
          (previous: typeof staffMember | null | undefined) =>
            previous ? { ...previous, avatar: data.avatarUrl } : previous,
        );
        queryClient.setQueryData(
          ["staff", store?.id],
          (previous: (typeof staffMember)[] | undefined) =>
            Array.isArray(previous)
              ? previous.map((member) =>
                  member.id === staffMember.id
                    ? { ...member, avatar: data.avatarUrl }
                    : member,
                )
              : previous,
        );
      }

      refetchUser();
      setAvatarFile(null);
      setAvatarPreview(data?.avatarUrl ?? null);
      toast.success("Avatar updated", {
        description: "Your profile photo has been updated.",
      });
    },
    onError: () => {
      toast.error("Avatar upload failed", {
        description: "Please try again with a valid image.",
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

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarUpload = () => {
    if (!avatarFile || !store || !staffMember) return;
    avatarMutation.mutate(avatarFile);
  };

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

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
  const displayAvatar =
    avatarPreview || staffMember?.avatar || user?.avatar || "";
  const displayInitials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={displayAvatar || undefined}
                    alt={displayName}
                  />
                  <AvatarFallback>{displayInitials || "ST"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Profile Photo
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF, or WebP up to 5MB
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarSelect}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={!staffMember || avatarMutation.isPending}
                >
                  Choose Photo
                </Button>
                <Button
                  type="button"
                  onClick={handleAvatarUpload}
                  disabled={
                    !staffMember ||
                    !avatarFile ||
                    avatarMutation.isPending ||
                    !store
                  }
                >
                  {avatarMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Upload
                </Button>
              </div>
            </div>

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
