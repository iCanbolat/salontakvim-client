import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storeService } from "@/services/store.service";
import { notificationService } from "@/services/notification.service";
import type { UpdateNotificationSettingsDto } from "@/types/notification.types";
import { toast } from "sonner";

export function useNotificationSettings() {
  const queryClient = useQueryClient();

  // Get current store
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["store"],
    queryFn: storeService.getMyStore,
  });

  // Get notification settings
  const {
    data: settings,
    isLoading: settingsLoading,
    error,
  } = useQuery({
    queryKey: ["notificationSettings", store?.id],
    queryFn: () => notificationService.getNotificationSettings(store!.id),
    enabled: !!store?.id,
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateNotificationSettingsDto) =>
      notificationService.updateNotificationSettings(store!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notificationSettings", store?.id],
      });
      toast.success("Notification settings updated successfully");
    },
    onError: () => {
      toast.error("Failed to update notification settings");
    },
  });

  const handleUpdate = (
    field: keyof UpdateNotificationSettingsDto,
    value: unknown,
  ) => {
    updateMutation.mutate({ [field]: value } as UpdateNotificationSettingsDto);
  };

  const isLoading = storeLoading || settingsLoading;

  return {
    state: {
      isLoading,
      error,
      isUpdating: updateMutation.isPending,
    },
    actions: {
      handleUpdate,
    },
    data: {
      store,
      settings,
    },
  };
}
