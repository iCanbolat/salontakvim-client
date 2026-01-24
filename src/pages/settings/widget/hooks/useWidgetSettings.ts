import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storeService } from "@/services/store.service";
import { widgetService } from "@/services/widget.service";
import type {
  UpdateWidgetSettingsDto,
  WidgetSettings as WidgetSettingsType,
} from "@/types/widget.types";
import { toast } from "sonner";

export function useWidgetSettings() {
  const [activeTab, setActiveTab] = useState("layout");
  const [showPreview, setShowPreview] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [domainsInput, setDomainsInput] = useState("");
  const [pendingChanges, setPendingChanges] = useState<UpdateWidgetSettingsDto>(
    {},
  );

  const queryClient = useQueryClient();

  // Get current store
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["store"],
    queryFn: storeService.getMyStore,
  });

  // Get widget settings
  const {
    data: settings,
    isLoading: settingsLoading,
    error,
  } = useQuery({
    queryKey: ["widgetSettings", store?.id],
    queryFn: () => widgetService.getWidgetSettings(store!.id),
    enabled: !!store?.id,
  });

  // Get embed code
  const { data: embedCode } = useQuery({
    queryKey: ["widgetEmbedCode", store?.id],
    queryFn: () => widgetService.getEmbedCode(store!.id),
    enabled: !!store?.id,
  });

  useEffect(() => {
    if (settings?.allowedDomains) {
      setDomainsInput(settings.allowedDomains.join("\n"));
    }
  }, [settings?.allowedDomains]);

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateWidgetSettingsDto) =>
      widgetService.updateWidgetSettings(store!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["widgetSettings", store?.id],
      });
      setPendingChanges({});
      toast.success("Widget settings saved successfully");
    },
    onError: () => {
      toast.error("Failed to save widget settings");
    },
  });

  // Regenerate key mutation
  const regenerateMutation = useMutation({
    mutationFn: () => widgetService.regenerateWidgetKey(store!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["widgetSettings", store?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["widgetEmbedCode", store?.id],
      });
      toast.success("Widget key regenerated successfully");
    },
    onError: () => {
      toast.error("Failed to regenerate widget key");
    },
  });

  const updateAllowedDomainsMutation = useMutation({
    mutationFn: (domains: string[]) =>
      widgetService.updateAllowedDomains(store!.id, domains),
    onSuccess: (data) => {
      setDomainsInput(data.allowedDomains.join("\n"));
      queryClient.invalidateQueries({
        queryKey: ["widgetSettings", store?.id],
      });
      toast.success("Allowed domains updated");
    },
    onError: () => {
      toast.error("Failed to update allowed domains");
    },
  });

  // Local update handler
  const handleUpdate = (
    field: keyof UpdateWidgetSettingsDto,
    value: unknown,
  ) => {
    setPendingChanges((prev) => ({ ...prev, [field]: value }));
  };

  // Save all pending changes
  const handleSaveChanges = () => {
    if (Object.keys(pendingChanges).length === 0) {
      toast.info("No changes to save");
      return;
    }
    updateMutation.mutate(pendingChanges);
  };

  const handleResetChanges = () => {
    setPendingChanges({});
    toast.info("Changes reset");
  };

  const hasUnsavedChanges = Object.keys(pendingChanges).length > 0;

  const hasDomainChanges = useMemo(() => {
    if (!settings) return false;
    const current = settings.allowedDomains || [];
    const next = domainsInput
      .split(/[\n,]/)
      .map((domain) => domain.trim())
      .filter(Boolean);
    if (current.length !== next.length) return true;
    return current.some((domain, index) => domain !== next[index]);
  }, [domainsInput, settings]);

  const previewSettings = useMemo((): WidgetSettingsType | null => {
    if (!settings) return null;
    return {
      ...settings,
      ...pendingChanges,
      sidebarMenuItems: {
        ...settings.sidebarMenuItems,
        ...(pendingChanges.sidebarMenuItems || {}),
      },
    } as WidgetSettingsType;
  }, [settings, pendingChanges]);

  const isLoading = storeLoading || settingsLoading;

  return {
    state: {
      activeTab,
      showPreview,
      copiedKey,
      copiedEmbed,
      domainsInput,
      pendingChanges,
      isLoading,
      hasUnsavedChanges,
      hasDomainChanges,
      error,
    },
    actions: {
      setActiveTab,
      setShowPreview,
      setCopiedKey,
      setCopiedEmbed,
      setDomainsInput,
      handleUpdate,
      handleSaveChanges,
      handleResetChanges,
      handleRegenerateKey: () => regenerateMutation.mutate(),
      handleUpdateDomains: (domains: string[]) =>
        updateAllowedDomainsMutation.mutate(domains),
    },
    data: {
      store,
      settings,
      embedCode,
      previewSettings,
    },
  };
}
