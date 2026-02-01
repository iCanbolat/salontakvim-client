import {
  Palette,
  Type,
  Layout,
  Settings,
  Code,
  AlertCircle,
  RotateCcw,
  Loader2,
  Eye,
  Save,
  Globe2,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { WidgetPreview } from "./components/WidgetPreview";
import { useWidgetSettings } from "./hooks/useWidgetSettings";
import type { WidgetSettings as WidgetSettingsType } from "@/types/widget.types";

export function WidgetSettings() {
  const { state, actions, data } = useWidgetSettings();
  const {
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
  } = state;

  const {
    setActiveTab,
    setShowPreview,
    setCopiedKey,
    setCopiedEmbed,
    setDomainsInput,
    handleUpdate,
    handleSaveChanges,
    handleResetChanges,
    handleRegenerateKey,
    handleUpdateDomains,
    handleUnblockWidget,
  } = actions;

  const { store, settings, embedCode, securityStatus, previewSettings } = data;

  // Helper to get current value (pending or original)
  const getCurrentValue = <K extends keyof WidgetSettingsType>(
    key: K,
  ): WidgetSettingsType[K] => {
    if (pendingChanges && key in pendingChanges) {
      return pendingChanges[
        key as keyof typeof pendingChanges
      ] as WidgetSettingsType[K];
    }
    return settings![key];
  };

  // Helper to get current sidebarMenuItems value
  const getCurrentSidebarItem = (
    key: keyof WidgetSettingsType["sidebarMenuItems"],
  ): boolean => {
    if (
      pendingChanges.sidebarMenuItems &&
      key in pendingChanges.sidebarMenuItems
    ) {
      return pendingChanges.sidebarMenuItems[key]!;
    }
    return settings!.sidebarMenuItems[key];
  };

  const onCopyKey = () => {
    if (settings?.widgetKey) {
      navigator.clipboard.writeText(settings.widgetKey);
      setCopiedKey(true);
      toast.success("Widget key copied to clipboard");
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const onCopyEmbed = () => {
    if (embedCode?.embedCode) {
      navigator.clipboard.writeText(embedCode.embedCode);
      setCopiedEmbed(true);
      toast.success("Embed code copied to clipboard");
      setTimeout(() => setCopiedEmbed(false), 2000);
    }
  };

  const onRegenerateKey = () => {
    if (
      confirm(
        "Are you sure? This will invalidate your current widget key and all existing widget installations will stop working.",
      )
    ) {
      handleRegenerateKey();
    }
  };

  const onUnblockWidget = () => {
    if (
      confirm(
        "Unblock widget access? This will re-enable public access immediately.",
      )
    ) {
      handleUnblockWidget();
    }
  };

  const parseDomainsInput = () => {
    const parsed = domainsInput
      .split(/[\n,]/)
      .map((domain) => domain.trim())
      .filter(Boolean);

    const unique = Array.from(new Set(parsed));

    const invalid = unique.filter((domain) => {
      const cleaned = domain.startsWith("*.") ? domain.slice(2) : domain;
      if (!cleaned || cleaned.includes(" ")) return true;
      try {
        const url = new URL(`http://${cleaned}`);
        return !url.hostname;
      } catch {
        return true;
      }
    });

    return { unique, invalid };
  };

  const onSaveAllowedDomains = () => {
    const { unique, invalid } = parseDomainsInput();

    if (invalid.length > 0) {
      toast.error(`Invalid domain(s): ${invalid.join(", ")}`);
      return;
    }

    handleUpdateDomains(unique);
  };

  const onResetAllowedDomains = () => {
    setDomainsInput((settings?.allowedDomains || []).join("\n"));
  };

  if (isLoading) {
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
          {hasUnsavedChanges && (
            <Button
              variant="ghost"
              onClick={handleResetChanges}
              className="w-fit text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
          <Button
            onClick={handleSaveChanges}
            disabled={!hasUnsavedChanges}
            className="w-fit"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
            {hasUnsavedChanges && (
              <Badge
                variant="secondary"
                className="ml-2 bg-primary-foreground/20"
              >
                {Object.keys(pendingChanges).length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <div
        className={`grid gap-6 ${
          showPreview ? "min-[1400px]:grid-cols-2" : ""
        }`}
      >
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

            <TabsContent value="layout" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Layout Mode</CardTitle>
                  <CardDescription>
                    Choose how your widget displays booking steps
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Company Email</Label>
                      <p className="text-sm text-muted-foreground">
                        Display company email in confirmation step
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
                    { key: "extras", label: "Extras Selection" },
                    { key: "payment", label: "Payment" },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between"
                    >
                      <Label>{item.label}</Label>
                      <Switch
                        checked={getCurrentSidebarItem(
                          item.key as keyof WidgetSettingsType["sidebarMenuItems"],
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
            </TabsContent>

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
                              item.key as keyof WidgetSettingsType,
                            ) as string
                          }
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={
                            getCurrentValue(
                              item.key as keyof WidgetSettingsType,
                            ) as string
                          }
                          onChange={(e) =>
                            handleUpdate(item.key as any, e.target.value)
                          }
                          className="w-20 h-10 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={
                            getCurrentValue(
                              item.key as keyof WidgetSettingsType,
                            ) as string
                          }
                          onChange={(e) =>
                            handleUpdate(item.key as any, e.target.value)
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
                      <Label>Border Radius</Label>
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
                          parseInt(e.target.value),
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

            <TabsContent value="embed" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Allowed Domains</CardTitle>
                  <CardDescription>
                    Restrict which hostnames can load the public widget
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Globe2 className="h-4 w-4" /> Domain allowlist
                    </Label>
                    <Textarea
                      value={domainsInput}
                      onChange={(e) => setDomainsInput(e.target.value)}
                      placeholder="example.com\nsub.example.com\n*.example.org"
                      rows={4}
                      className="font-mono text-sm"
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter one domain per line. Wildcards are supported with a
                      leading *. Do not include protocol or paths.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={onSaveAllowedDomains}
                      disabled={!hasDomainChanges}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Allowlist
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={onResetAllowedDomains}
                      disabled={!hasDomainChanges}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Widget Key</CardTitle>
                  <CardDescription>
                    Your unique widget identifier
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {securityStatus?.blocked && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="space-y-1">
                        <div>
                          Widget access is temporarily disabled due to
                          suspicious activity.
                        </div>
                        {securityStatus.blockedAt && (
                          <div className="text-xs text-muted-foreground">
                            Blocked at: {securityStatus.blockedAt}
                          </div>
                        )}
                        {securityStatus.ttlSeconds && (
                          <div className="text-xs text-muted-foreground">
                            Auto-unlock in about{" "}
                            {Math.ceil(securityStatus.ttlSeconds / 60)} minutes
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="flex gap-2">
                    <Input
                      value={settings.widgetKey}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={onCopyKey}
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
                    <Button variant="destructive" onClick={onRegenerateKey}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate Key
                    </Button>
                    {securityStatus?.blocked && (
                      <Button variant="outline" onClick={onUnblockWidget}>
                        Unlock Widget
                      </Button>
                    )}
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
                    Add this code where you want the widget to appear (usually
                    before the closing &lt;/body&gt; tag)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Textarea
                      value={embedCode?.embedCode || ""}
                      readOnly
                      rows={10}
                      className="font-mono text-xs leading-relaxed bg-slate-50"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-3 right-3"
                      onClick={onCopyEmbed}
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
