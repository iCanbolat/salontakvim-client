import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storeService } from "@/services/store.service";
import { widgetService } from "@/services/widget.service";
import { qk } from "@/lib/query-keys";
import type {
  UpdateWidgetSettingsDto,
  WidgetSettings as WidgetSettingsType,
} from "@/types/widget.types";
import { toast } from "sonner";

const LOCALHOST_DOMAINS = new Set(["localhost", "127.0.0.1"]);

const getConfiguredDomain = (domains?: string[]) => {
  if (!domains?.length) return "";

  return (
    domains
      .map((domain) => domain.trim().toLowerCase())
      .find((domain) => domain && !LOCALHOST_DOMAINS.has(domain)) || ""
  );
};

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
    queryKey: qk.currentStore,
    queryFn: storeService.getMyStore,
  });

  // Get widget settings
  const {
    data: settings,
    isLoading: settingsLoading,
    error,
  } = useQuery({
    queryKey: qk.widgetSettings(store?.id),
    queryFn: () => widgetService.getWidgetSettings(store!.id),
    enabled: !!store?.id,
  });

  // Get embed code
  const { data: embedCode } = useQuery({
    queryKey: qk.widgetEmbedCode(store?.id),
    queryFn: () => widgetService.getEmbedCode(store!.id),
    enabled: !!store?.id,
  });

  // Get widget security status
  const { data: securityStatus } = useQuery({
    queryKey: qk.widgetSecurityStatus(store?.id),
    queryFn: () => widgetService.getWidgetSecurityStatus(store!.id),
    enabled: !!store?.id,
  });

  useEffect(() => {
    if (!settings) return;
    setDomainsInput(getConfiguredDomain(settings.allowedDomains));
  }, [settings?.allowedDomains]);

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateWidgetSettingsDto) =>
      widgetService.updateWidgetSettings(store!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: qk.widgetSettings(store?.id),
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
        queryKey: qk.widgetSettings(store?.id),
      });
      queryClient.invalidateQueries({
        queryKey: qk.widgetEmbedCode(store?.id),
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
      setDomainsInput(getConfiguredDomain(data.allowedDomains));
      queryClient.invalidateQueries({
        queryKey: qk.widgetSettings(store?.id),
      });
      toast.success("Allowed domains updated");
    },
    onError: () => {
      toast.error("Failed to update allowed domains");
    },
  });

  const unblockMutation = useMutation({
    mutationFn: () => widgetService.unblockWidgetAccess(store!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: qk.widgetSecurityStatus(store?.id),
      });
      toast.success("Widget access unblocked");
    },
    onError: () => {
      toast.error("Failed to unblock widget access");
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
    const current = getConfiguredDomain(settings.allowedDomains);
    const next = domainsInput.trim().toLowerCase();

    if (LOCALHOST_DOMAINS.has(next)) {
      return current !== "";
    }

    return current !== next;
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
      handleUnblockWidget: () => unblockMutation.mutate(),
    },
    data: {
      store,
      settings,
      embedCode,
      securityStatus,
      previewSettings,
    },
  };
}
