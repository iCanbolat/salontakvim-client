import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { storeService } from "@/services";
import type { UpdateStoreDto } from "@/types";

// Validation schema
const storeSettingsSchema = z.object({
  name: z.string().min(1, "Store name is required").max(255),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(255)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only"),
  description: z.string().max(1000).optional(),
  email: z
    .string()
    .email("Invalid email address")
    .max(255)
    .optional()
    .or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  currency: z
    .string()
    .length(3, "Currency code must be 3 characters (e.g., USD, EUR, TRY)")
    .optional()
    .or(z.literal("")),
});

export type StoreSettingsFormData = z.infer<typeof storeSettingsSchema>;

export function useStoreSettings() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch store data
  const {
    data: store,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
  });

  // Form setup
  const form = useForm<StoreSettingsFormData>({
    resolver: zodResolver(storeSettingsSchema),
    values: store
      ? {
          name: store.name,
          slug: store.slug,
          description: store.description || "",
          email: store.email || "",
          phone: store.phone || "",
          currency: store.currency || "USD",
        }
      : undefined,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateStoreDto) =>
      storeService.updateStore(store!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-store"] });
      setIsEditing(false);
      setFormError(null);
    },
    onError: (err: unknown) => {
      const maybeAxios = err as { response?: { status?: number; data?: any } };
      if (maybeAxios?.response?.status === 409) {
        setFormError("This slug is already taken. Please choose another.");
      } else {
        const message = maybeAxios?.response?.data?.message;
        setFormError(
          typeof message === "string"
            ? message
            : "Failed to update store settings.",
        );
      }
    },
  });

  const onSubmit = (data: StoreSettingsFormData) => {
    const updateData: UpdateStoreDto = {
      name: data.name,
      slug: data.slug,
      description: data.description || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      currency: data.currency || undefined,
    };
    updateMutation.mutate(updateData);
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
    setFormError(null);
  };

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  return {
    state: {
      isEditing,
      formError,
      isLoading,
      error,
      isPending: updateMutation.isPending,
      isSuccess: updateMutation.isSuccess,
    },
    actions: {
      setIsEditing,
      onSubmit: form.handleSubmit(onSubmit),
      handleCancel,
      slugify,
      setFormError,
    },
    data: {
      store,
    },
    form,
  };
}
