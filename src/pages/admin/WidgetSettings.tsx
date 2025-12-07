import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storeService } from "@/services/store.service";
import { widgetService } from "@/services/widget.service";
import type { UpdateWidgetSettingsDto, WidgetSettings as WidgetSettingsType } from "@/types/widget.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  RefreshCw,
  Check,
  Palette,
  Type,
  Layout,
  Settings,
  Code,
  AlertCircle,
  Loader2,
  Eye,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { WidgetPreview } from "@/components/widget";

export default function WidgetSettings() {
  const [activeTab, setActiveTab] = useState("layout");
  const [showPreview, setShowPreview] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedIframe, setCopiedIframe] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<UpdateWidgetSettingsDto>({});
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

  // Local update handler - updates pending changes without API call
  const handleUpdate = (
    field: keyof UpdateWidgetSettingsDto,
    value: unknown
  ) => {
    setPendingChanges((prev) => ({ ...prev, [field]: value }));
  };

  // Save all pending changes to API
  const handleSaveChanges = () => {
    if (Object.keys(pendingChanges).length === 0) {
      toast.info("No changes to save");
      return;
    }
    updateMutation.mutate(pendingChanges);
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = Object.keys(pendingChanges).length > 0;

  // Merged settings: original settings + pending changes for preview
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

  // Helper to get current value (pending or original)
  const getCurrentValue = <K extends keyof WidgetSettingsType>(key: K): WidgetSettingsType[K] => {
    if (key in pendingChanges) {
      return pendingChanges[key as keyof UpdateWidgetSettingsDto] as WidgetSettingsType[K];
    }
    return settings![key];
  };

  // Helper to get current sidebarMenuItems value
  const getCurrentSidebarItem = (key: keyof WidgetSettingsType["sidebarMenuItems"]): boolean => {
    if (pendingChanges.sidebarMenuItems && key in pendingChanges.sidebarMenuItems) {
      return pendingChanges.sidebarMenuItems[key]!;
    }
    return settings!.sidebarMenuItems[key];
  };

  const handleCopyKey = () => {
    if (settings?.widgetKey) {
      navigator.clipboard.writeText(settings.widgetKey);
      setCopiedKey(true);
      toast.success("Widget key copied to clipboard");
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleCopyEmbed = () => {
    if (embedCode?.embedCode) {
      navigator.clipboard.writeText(embedCode.embedCode);
      setCopiedEmbed(true);
      toast.success("Embed code copied to clipboard");
      setTimeout(() => setCopiedEmbed(false), 2000);
    }
  };

  const handleCopyIframe = () => {
    if (embedCode?.iframeCode) {
      navigator.clipboard.writeText(embedCode.iframeCode);
      setCopiedIframe(true);
      toast.success("Iframe code copied to clipboard");
      setTimeout(() => setCopiedIframe(false), 2000);
    }
  };

  const handleRegenerateKey = () => {
    if (
      confirm(
        "Are you sure? This will invalidate your current widget key and all existing widget installations will stop working."
      )
    ) {
      regenerateMutation.mutate();
    }
  };

  useEffect(() => {
    if (!settings) return;

    if (settings.layout !== "steps") {
      // Auto-update layout to steps if it's not already
      updateMutation.mutate({ layout: "steps" });
    }
  }, [settings?.layout]);

  if (storeLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load widget settings</AlertDescription>
      </Alert>
    );
  }

  if (!settings || !store) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Widget Settings</h1>
          <p className="text-muted-foreground">
            Customize your booking widget appearance and behavior
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="w-fit"
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? "Hide Preview" : "Show Preview"}
          </Button>
          <Button
            onClick={handleSaveChanges}
            disabled={!hasUnsavedChanges || updateMutation.isPending}
            className="w-fit"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
            {hasUnsavedChanges && (
              <Badge variant="secondary" className="ml-2 bg-primary-foreground/20">
                {Object.keys(pendingChanges).length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <div className={`grid gap-6 ${showPreview ? "xl:grid-cols-2" : ""}`}>
        {/* Settings Panel */}
        <div className="space-y-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <div className="overflow-x-auto -mx-2 px-2">
              <TabsList className="inline-flex w-auto min-w-full">
                <TabsTrigger
                  value="layout"
                  className="flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Layout className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">Layout</span>
                </TabsTrigger>
                <TabsTrigger
                  value="colors"
                  className="flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Palette className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">Colors</span>
                </TabsTrigger>
                <TabsTrigger
                  value="typography"
                  className="flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Type className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">Typography</span>
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Settings className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
                <TabsTrigger
                  value="embed"
                  className="flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Code className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">Embed Code</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Layout & Structure Tab */}
            <TabsContent value="layout" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Layout Mode</CardTitle>
                  <CardDescription>
                    Choose how your widget displays booking steps
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* <div className="space-y-2">
                <Label>Layout</Label>
                <div className="rounded-md border bg-muted/50 p-3">
                  <p className="font-medium">Steps (Multi-Step Wizard)</p>
                  <p className="text-sm text-muted-foreground">
                    The widget now always uses the multi-step experience.
                  </p>
                </div>
              </div> */}

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Company Email</Label>
                      <p className="text-sm text-muted-foreground">
                        Display company email in widget header
                      </p>
                    </div>
                    <Switch
                      checked={getCurrentValue("showCompanyEmail")}
                      onCheckedChange={(checked) =>
                        handleUpdate("showCompanyEmail", checked)
                      }
                    />
                  </div>

                  {getCurrentValue("showCompanyEmail") && (
                    <div className="space-y-2">
                      <Label>Company Email</Label>
                      <Input
                        type="email"
                        placeholder="contact@example.com"
                        value={getCurrentValue("companyEmail") || ""}
                        onChange={(e) =>
                          handleUpdate("companyEmail", e.target.value)
                        }
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sidebar Menu Items</CardTitle>
                  <CardDescription>
                    Control which steps appear in the sidebar menu
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: "service", label: "Service Selection" },
                    { key: "employee", label: "Employee Selection" },
                    { key: "location", label: "Location Selection" },
                    { key: "extras", label: "Extras Selection" },
                    { key: "dateTime", label: "Date & Time Selection" },
                    { key: "customerInfo", label: "Customer Information" },
                    { key: "payment", label: "Payment" },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between"
                    >
                      <Label>{item.label}</Label>
                      <Switch
                        checked={getCurrentSidebarItem(
                          item.key as keyof WidgetSettingsType["sidebarMenuItems"]
                        )}
                        onCheckedChange={(checked) =>
                          handleUpdate("sidebarMenuItems", {
                            ...settings.sidebarMenuItems,
                            ...(pendingChanges.sidebarMenuItems || {}),
                            [item.key]: checked,
                          })
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Field Requirements</CardTitle>
                  <CardDescription>
                    Set which customer fields are required
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      key: "employeeRequired",
                      label: "Employee Selection Required",
                    },
                    {
                      key: "locationRequired",
                      label: "Location Selection Required",
                    },
                    { key: "lastNameRequired", label: "Last Name Required" },
                    { key: "emailRequired", label: "Email Required" },
                    { key: "phoneRequired", label: "Phone Required" },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between"
                    >
                      <Label>{item.label}</Label>
                      <Switch
                        checked={
                          getCurrentValue(item.key as keyof WidgetSettingsType) as boolean
                        }
                        onCheckedChange={(checked) =>
                          handleUpdate(
                            item.key as keyof UpdateWidgetSettingsDto,
                            checked
                          )
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Color Customization</CardTitle>
                  <CardDescription>
                    Customize your widget colors to match your brand
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    {
                      key: "primaryColor",
                      label: "Primary Color",
                      description: "Main brand color",
                    },
                    {
                      key: "secondaryColor",
                      label: "Secondary Color",
                      description: "Accent color",
                    },
                    {
                      key: "sidebarBackgroundColor",
                      label: "Sidebar Background",
                      description: "Sidebar background color",
                    },
                    {
                      key: "contentBackgroundColor",
                      label: "Content Background",
                      description: "Main content area background",
                    },
                    {
                      key: "textColor",
                      label: "Text Color",
                      description: "Default text color",
                    },
                    {
                      key: "headingColor",
                      label: "Heading Color",
                      description: "Headings and titles color",
                    },
                  ].map((item) => (
                    <div key={item.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>{item.label}</Label>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                        <Badge variant="outline" className="font-mono">
                          {
                            getCurrentValue(
                              item.key as keyof WidgetSettingsType
                            ) as string
                          }
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={
                            getCurrentValue(
                              item.key as keyof WidgetSettingsType
                            ) as string
                          }
                          onChange={(e) =>
                            handleUpdate(
                              item.key as keyof UpdateWidgetSettingsDto,
                              e.target.value
                            )
                          }
                          className="w-20 h-10 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={
                            getCurrentValue(
                              item.key as keyof WidgetSettingsType
                            ) as string
                          }
                          onChange={(e) =>
                            handleUpdate(
                              item.key as keyof UpdateWidgetSettingsDto,
                              e.target.value
                            )
                          }
                          placeholder="#000000"
                          className="flex-1 font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Typography Tab */}
            <TabsContent value="typography" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Typography Settings</CardTitle>
                  <CardDescription>
                    Configure font and text sizing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Font Family</Label>
                    <Select
                      value={getCurrentValue("fontFamily")}
                      onValueChange={(value) =>
                        handleUpdate("fontFamily", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="Open Sans">Open Sans</SelectItem>
                        <SelectItem value="Lato">Lato</SelectItem>
                        <SelectItem value="Poppins">Poppins</SelectItem>
                        <SelectItem value="Montserrat">Montserrat</SelectItem>
                        <SelectItem value="Nunito">Nunito</SelectItem>
                        <SelectItem value="Raleway">Raleway</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Button Border Radius</Label>
                      <span className="text-sm text-muted-foreground">
                        {getCurrentValue("buttonBorderRadius")}px
                      </span>
                    </div>
                    <Input
                      type="range"
                      value={getCurrentValue("buttonBorderRadius")}
                      onChange={(e) =>
                        handleUpdate(
                          "buttonBorderRadius",
                          parseInt(e.target.value)
                        )
                      }
                      min={0}
                      max={24}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-sm text-muted-foreground">
                      0px = square, 24px = fully rounded
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Other Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Additional Settings</CardTitle>
                  <CardDescription>
                    Configure widget behavior and features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow Guest Booking</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow customers to book without creating an account
                      </p>
                    </div>
                    <Switch
                      checked={getCurrentValue("allowGuestBooking")}
                      onCheckedChange={(checked) =>
                        handleUpdate("allowGuestBooking", checked)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Redirect URL After Booking</Label>
                    <Input
                      type="url"
                      placeholder="https://example.com/thank-you"
                      value={getCurrentValue("redirectUrlAfterBooking") || ""}
                      onChange={(e) =>
                        handleUpdate("redirectUrlAfterBooking", e.target.value)
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      Optional: Redirect customers to a specific page after
                      booking
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Embed Code Tab */}
            <TabsContent value="embed" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Widget Key</CardTitle>
                  <CardDescription>
                    Your unique widget identifier
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={settings.widgetKey}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyKey}
                      disabled={copiedKey}
                    >
                      {copiedKey ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={handleRegenerateKey}
                      disabled={regenerateMutation.isPending}
                    >
                      {regenerateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Regenerate Key
                    </Button>
                  </div>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Regenerating the widget key will invalidate all existing
                      widget installations. Use this only if your key has been
                      compromised.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>JavaScript Embed Code</CardTitle>
                  <CardDescription>
                    Add this code to your website before the closing
                    &lt;/body&gt; tag
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Textarea
                      value={embedCode?.embedCode || ""}
                      readOnly
                      rows={3}
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleCopyEmbed}
                      disabled={copiedEmbed}
                    >
                      {copiedEmbed ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Iframe Embed Code</CardTitle>
                  <CardDescription>
                    Alternative embedding method using iframe
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Textarea
                      value={embedCode?.iframeCode || ""}
                      readOnly
                      rows={3}
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleCopyIframe}
                      disabled={copiedIframe}
                    >
                      {copiedIframe ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        {showPreview && previewSettings && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="h-5 w-5" />
                  Live Preview
                  {hasUnsavedChanges && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Unsaved changes
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  See how your widget will look to customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WidgetPreview settings={previewSettings} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
