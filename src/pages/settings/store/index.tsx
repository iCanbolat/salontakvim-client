import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  AlertCircle,
  Building2,
  Save,
  X,
  ImagePlus,
  Trash2,
  CreditCard,
  RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Badge } from "../../../components/ui/badge";
import { PageLoader } from "@/components/common/PageLoader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { useStoreSettings } from "./hooks/useStoreSettings";
import { storeService } from "@/services/store.service";
import { billingService } from "@/services/billing.service";
import { qk } from "@/lib/query-keys";
import { useConfirmDialog } from "@/contexts/ConfirmDialogProvider";

export function StoreSettings() {
  const { state, actions, data, form } = useStoreSettings();
  const { isEditing, formError, isLoading, error, isPending, isSuccess } =
    state;
  const { store } = data;
  const {
    register,
    setValue,
    setFocus,
    watch,
    formState: { errors, isDirty },
  } = form;

  useEffect(() => {
    if (errors.slug) {
      setFocus("slug");
    }
  }, [errors.slug, setFocus]);

  const queryClient = useQueryClient();
  const { confirm } = useConfirmDialog();
  const [isUploading, setIsUploading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<
    "starter" | "pro" | "enterprise"
  >("starter");
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<
    "monthly" | "annual"
  >("monthly");
  const storeId = store?.id;

  const connectStatusQuery = useQuery({
    queryKey: qk.billingConnectStatus(storeId),
    queryFn: async () => {
      if (!storeId) {
        throw new Error("Store not found");
      }

      return billingService.getConnectStatus(storeId);
    },
    enabled: Boolean(storeId),
    staleTime: 30_000,
  });

  const pricingByPlan = {
    starter: { monthly: "$39/mo", annual: "$29/mo" },
    pro: { monthly: "$59/mo", annual: "$45/mo" },
    enterprise: { monthly: "Custom", annual: "Custom" },
  } as const;

  const renderPlanPrice = (plan: "starter" | "pro" | "enterprise") => {
    if (plan === "enterprise") {
      return <p className="font-semibold text-gray-900">Custom</p>;
    }

    if (selectedBillingCycle === "monthly") {
      return (
        <p className="font-semibold text-gray-900">
          {pricingByPlan[plan].monthly}
        </p>
      );
    }

    return (
      <div className="flex items-end gap-2">
        <p className="font-semibold text-gray-900">
          {pricingByPlan[plan].annual}
        </p>
        <p className="text-xs text-gray-500 line-through">
          {pricingByPlan[plan].monthly}
        </p>
      </div>
    );
  };

  useEffect(() => {
    if (store?.paymentStatus) {
      if (
        store.paymentStatus === "starter" ||
        store.paymentStatus === "pro" ||
        store.paymentStatus === "enterprise"
      ) {
        setSelectedPlan(store.paymentStatus);
      } else {
        setSelectedPlan("starter");
      }
    }
  }, [store?.paymentStatus]);

  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => storeService.uploadStoreImage(store!.id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.currentStore });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageUrl: string) =>
      storeService.deleteStoreImage(store!.id, imageUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.currentStore });
    },
  });

  const startSubscriptionMutation = useMutation({
    mutationFn: async ({
      plan,
      billingCycle,
    }: {
      plan: "starter" | "pro" | "enterprise";
      billingCycle: "monthly" | "annual";
    }) => {
      if (!storeId) {
        throw new Error("Store not found");
      }

      const currentUrl = window.location.href;
      return billingService.createSubscriptionCheckoutSession({
        storeId,
        successUrl: currentUrl,
        cancelUrl: currentUrl,
        plan,
        billingCycle,
      });
    },
    onSuccess: (result) => {
      if (!result.checkoutUrl) {
        setBillingError("Failed to get Creem checkout URL.");
        return;
      }
      window.location.href = result.checkoutUrl;
    },
    onError: (error: any) => {
      setBillingError(
        error?.response?.data?.message ||
          error?.message ||
          "Could not start subscription checkout.",
      );
    },
  });

  const createRecipientOnboardingMutation = useMutation({
    mutationFn: async () => {
      if (!storeId) {
        throw new Error("Store not found");
      }

      const currentUrl = window.location.href;
      return billingService.createConnectOnboardingLink({
        storeId,
        refreshUrl: currentUrl,
        returnUrl: currentUrl,
      });
    },
    onSuccess: (result) => {
      if (!result.onboardingUrl) {
        setBillingError("Failed to get Creem onboarding URL.");
        return;
      }

      window.location.href = result.onboardingUrl;
    },
    onError: (error: any) => {
      setBillingError(
        error?.response?.data?.message ||
          error?.message ||
          "Could not start Creem recipient onboarding.",
      );
    },
  });

  const markRecipientOnboardingCompleteMutation = useMutation({
    mutationFn: async () => {
      if (!storeId) {
        throw new Error("Store not found");
      }

      return billingService.updateConnectStatus(storeId, {
        onboardingComplete: true,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: qk.billingConnectStatus(storeId),
      });
      toast.success("Recipient onboarding status updated.");
    },
    onError: (error: any) => {
      setBillingError(
        error?.response?.data?.message ||
          error?.message ||
          "Could not update onboarding status.",
      );
    },
  });

  const refreshBillingData = async () => {
    setBillingError(null);
    await queryClient.invalidateQueries({ queryKey: qk.currentStore });
  };

  const refreshConnectStatus = async () => {
    setBillingError(null);
    await queryClient.invalidateQueries({
      queryKey: qk.billingConnectStatus(storeId),
    });
  };

  const connectStatus = connectStatusQuery.data;
  const connectStatusSource =
    connectStatus?.statusSource || "creem_dashboard_manual";
  const connectStatusSourceLabel =
    connectStatusSource === "creem_api"
      ? "Synced via Creem API"
      : "Manual tracking via Creem dashboard";
  const canConfirmOnboardingManually =
    connectStatusSource === "creem_dashboard_manual" &&
    !connectStatus?.onboardingComplete;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const currentCount = store?.storeImages?.length || 0;

    if (currentCount + fileList.length > 5) {
      toast.error(
        `En fazla 5 resim yükleyebilirsiniz. (Mevcut: ${currentCount})`,
      );
      return;
    }

    // Validate files
    for (const file of fileList) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} geçerli bir resim dosyası değil.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} boyutu 5MB'dan büyük olamaz.`);
        return;
      }
    }

    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const file of fileList) {
        try {
          await uploadImageMutation.mutateAsync(file);
          successCount++;
        } catch (err) {
          console.error(`Upload failed for ${file.name}:`, err);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} resim başarıyla yüklendi.`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} resim yüklenirken hata oluştu.`);
      }
    } finally {
      setIsUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    const isConfirmed = await confirm({
      title: "Resmi sil",
      description: "Bu resmi silmek istediginizden emin misiniz?",
      confirmText: "Sil",
      cancelText: "Iptal",
      variant: "destructive",
    });

    if (!isConfirmed) return;

    try {
      await deleteImageMutation.mutateAsync(imageUrl);
      toast.success("Resim başarıyla silindi.");
    } catch (err) {
      console.error("Image delete failed:", err);
      toast.error("Resim silinemedi. Lütfen tekrar deneyin.");
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || !store) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Store Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your store information and settings
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load store data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row text-center sm:text-start items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Store Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your store information and settings
          </p>
        </div>
        {!isEditing && (
          <Button onClick={() => actions.setIsEditing(true)}>
            <Building2 className="h-4 w-4 mr-2" />
            Edit Store
          </Button>
        )}
      </div>

      {/* Update Success Message */}
      {isSuccess && !isEditing && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Store settings updated successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Update Error Message */}
      {formError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {formError || "Failed to update store settings. Please try again."}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={actions.onSubmit} className="space-y-6">
        {/* Store Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
            <CardDescription>
              Basic information about your store
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Store Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Store Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                disabled={!isEditing}
                placeholder="My Awesome Salon"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Store Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">
                Store Slug (URL) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="slug"
                {...register("slug")}
                disabled={!isEditing}
                onChange={(e) => {
                  const cleaned = actions.slugify(e.target.value);
                  setValue("slug", cleaned, { shouldDirty: true });
                }}
                placeholder="my-salon"
              />
              {errors.slug && (
                <p className="text-sm text-red-600">{errors.slug.message}</p>
              )}
              <p className="text-sm text-gray-500">
                Public booking link: https://yourdomain.com/book/{"{"}slug{"}"}
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                disabled={!isEditing}
                rows={3}
                placeholder="Brief description about your store..."
              />
              {errors.description && (
                <p className="text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>How customers can reach you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                disabled={!isEditing}
                placeholder="contact@example.com"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                {...register("phone")}
                disabled={!isEditing}
                placeholder="+1 (555) 123-4567"
              />
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Business Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Business Settings</CardTitle>
            <CardDescription>
              Currency and other business configurations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency">Currency Code</Label>
              <Select
                disabled={!isEditing}
                value={watch("currency")}
                onValueChange={(val: "TRY" | "USD" | "EUR" | "GBP") =>
                  setValue("currency", val, { shouldDirty: true })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">TRY (₺) - Turkish Lira</SelectItem>
                  <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                  <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                </SelectContent>
              </Select>
              {errors.currency && (
                <p className="text-sm text-red-600">
                  {errors.currency.message}
                </p>
              )}
              <p className="text-sm text-gray-500">
                Supported currencies: TRY, USD, EUR, GBP
              </p>
            </div>

            {/* Store Status (Read-only) */}
            <div className="space-y-2">
              <Label>Store Status</Label>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    store.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {store.isActive ? "Active" : "Inactive"}
                </span>
                <p className="text-sm text-gray-500">
                  {store.isActive
                    ? "Your store is active and accepting bookings"
                    : "Your store is currently inactive"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing Card */}
        <Card>
          <CardHeader>
            <CardTitle>Creem Billing</CardTitle>
            <CardDescription>
              Manage subscription plan and billing cycle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Current Plan
                  </p>
                  <Badge variant="secondary" className="capitalize">
                    {store.paymentStatus}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Subscription Status
                  </p>
                  <Badge variant="outline" className="capitalize">
                    {(store.creemSubscriptionStatus || "not_started").replace(
                      /_/g,
                      " ",
                    )}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Billing Cycle
              </p>
              <div className="inline-flex rounded-full border border-gray-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setSelectedBillingCycle("monthly")}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    selectedBillingCycle === "monthly"
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBillingCycle("annual")}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    selectedBillingCycle === "annual"
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Annual
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Checkout request uses the selected cycle for plan pricing.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Choose Plan
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setSelectedPlan("starter")}
                  className={`p-4 border rounded-lg text-left transition-all hover:border-blue-500 cursor-pointer ${
                    selectedPlan === "starter"
                      ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="mb-1 flex items-start justify-between">
                    <h4 className="text-xs font-bold uppercase text-gray-400">
                      Starter
                    </h4>
                    {store.paymentStatus === "starter" && (
                      <Badge variant="outline" className="text-[10px]">
                        Current
                      </Badge>
                    )}
                  </div>
                  {renderPlanPrice("starter")}
                  <p className="mt-1 text-sm text-gray-600">
                    Essentials for small teams.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPlan("pro")}
                  className={`p-4 border rounded-lg text-left transition-all hover:border-blue-500 cursor-pointer ${
                    selectedPlan === "pro"
                      ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="mb-1 flex items-start justify-between">
                    <h4 className="text-xs font-bold uppercase text-gray-400">
                      Pro
                    </h4>
                    {store.paymentStatus === "pro" && (
                      <Badge variant="outline" className="text-[10px]">
                        Current
                      </Badge>
                    )}
                  </div>
                  {renderPlanPrice("pro")}
                  <p className="mt-1 text-sm text-gray-600">
                    Advanced features for growing teams.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPlan("enterprise")}
                  className={`p-4 border rounded-lg text-left transition-all hover:border-blue-500 cursor-pointer ${
                    selectedPlan === "enterprise"
                      ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="mb-1 flex items-start justify-between">
                    <h4 className="text-xs font-bold uppercase text-blue-400">
                      Enterprise
                    </h4>
                    {store.paymentStatus === "enterprise" && (
                      <Badge variant="outline" className="text-[10px]">
                        Current
                      </Badge>
                    )}
                  </div>
                  {renderPlanPrice("enterprise")}
                  <p className="mt-1 text-sm text-gray-600">
                    Multi-location and custom workflows.
                  </p>
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Recipient Onboarding (Revenue Split)
                  </p>
                  <p className="text-sm text-gray-600">
                    Redirect store owners to Creem onboarding and track
                    recipient status from this panel.
                  </p>
                </div>

                {connectStatusQuery.isFetching && (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Onboarding
                  </p>
                  <Badge
                    variant={
                      connectStatus?.onboardingComplete ? "default" : "outline"
                    }
                    className="capitalize"
                  >
                    {connectStatus?.onboardingComplete
                      ? "completed"
                      : "pending"}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Payouts
                  </p>
                  <Badge
                    variant={
                      connectStatus?.payoutsEnabled ? "default" : "outline"
                    }
                    className="capitalize"
                  >
                    {connectStatus?.payoutsEnabled ? "enabled" : "not enabled"}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Status Source
                  </p>
                  <Badge variant="secondary">{connectStatusSourceLabel}</Badge>
                </div>
              </div>

              {connectStatusQuery.isError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Could not fetch recipient onboarding status.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setBillingError(null);
                    createRecipientOnboardingMutation.mutate();
                  }}
                  disabled={createRecipientOnboardingMutation.isPending}
                >
                  {createRecipientOnboardingMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Open Creem Onboarding
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={refreshConnectStatus}
                  disabled={connectStatusQuery.isFetching}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Refresh Onboarding Status
                </Button>

                {canConfirmOnboardingManually && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setBillingError(null);
                      markRecipientOnboardingCompleteMutation.mutate();
                    }}
                    disabled={markRecipientOnboardingCompleteMutation.isPending}
                  >
                    {markRecipientOnboardingCompleteMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Mark as Completed"
                    )}
                  </Button>
                )}
              </div>
            </div>

            {billingError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{billingError}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => {
                  setBillingError(null);
                  startSubscriptionMutation.mutate({
                    plan: selectedPlan,
                    billingCycle: selectedBillingCycle,
                  });
                }}
                disabled={startSubscriptionMutation.isPending}
              >
                {startSubscriptionMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Continue to Creem Checkout
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={refreshBillingData}
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Refresh Billing
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Store Photos Card */}
        <Card>
          <CardHeader>
            <CardTitle>Store Photos</CardTitle>
            <CardDescription>
              Add photos to showcase your store on the booking page (max 5
              photos)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Photo Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {store.storeImages?.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
                  >
                    <img
                      src={imageUrl}
                      alt={`Store photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(imageUrl)}
                      disabled={deleteImageMutation.isPending}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                      aria-label="Delete photo"
                    >
                      {deleteImageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))}

                {/* Upload Button */}
                {(!store.storeImages || store.storeImages.length < 5) && (
                  <label
                    className={`relative aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors ${
                      isUploading ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="sr-only"
                      disabled={isUploading}
                    />
                    {isUploading ? (
                      <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                    ) : (
                      <>
                        <ImagePlus className="h-8 w-8 text-gray-400" />
                        <span className="mt-2 text-xs text-gray-500">
                          Add Photo
                        </span>
                      </>
                    )}
                  </label>
                )}
              </div>

              {store.storeImages && store.storeImages.length >= 5 && (
                <p className="text-sm text-gray-500">
                  Maximum 5 photos reached. Delete existing photos to add new
                  ones.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Store Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle>Store Statistics</CardTitle>
            <CardDescription>
              Overview of your store performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Total Appointments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {store.totalAppointments.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {store.totalCustomers.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={!isDirty || isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={actions.handleCancel}
              disabled={isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </form>

      {/* Metadata */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Created</p>
              <p className="font-medium">
                {new Date(store.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Last Updated</p>
              <p className="font-medium">
                {new Date(store.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
