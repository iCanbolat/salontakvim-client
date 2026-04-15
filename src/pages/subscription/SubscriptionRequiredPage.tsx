import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CreditCard, Loader2, LogOut } from "lucide-react";
import { useAuth } from "@/contexts";
import { authService, billingService, storeService } from "@/services";
import { qk } from "@/lib/query-keys";
import { PageLoader } from "@/components/common/PageLoader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

type BillingCycle = "monthly" | "annual";
type Plan = "starter" | "pro" | "enterprise";

const pricingByPlan = {
  starter: { monthly: "$39/mo", annual: "$29/mo" },
  pro: { monthly: "$59/mo", annual: "$45/mo" },
  enterprise: { monthly: "Custom", annual: "Custom" },
} as const;

export default function SubscriptionRequiredPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<Plan>("starter");
  const [selectedBillingCycle, setSelectedBillingCycle] =
    useState<BillingCycle>("monthly");
  const [billingError, setBillingError] = useState<string | null>(null);

  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: qk.currentStore,
    queryFn: () => storeService.getMyStore(),
  });

  useEffect(() => {
    if (store && store.paymentStatus !== "trial") {
      authService.clearSubscriptionState();
      navigate("/dashboard", { replace: true });
    }
  }, [store, navigate]);

  const startSubscriptionMutation = useMutation({
    mutationFn: async () => {
      if (!store?.id) {
        throw new Error("Store not found");
      }

      const returnUrl = `${window.location.origin}/subscription`;
      return billingService.createSubscriptionCheckoutSession({
        storeId: store.id,
        successUrl: returnUrl,
        cancelUrl: returnUrl,
        plan: selectedPlan,
        billingCycle: selectedBillingCycle,
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

  const renderPlanPrice = (plan: Plan) => {
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

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  if (storeLoading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Trial Ended</CardTitle>
            <CardDescription>
              Your 14-day free trial has ended. Choose a plan to continue using
              SalonTakvim.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Current Status
                </p>
                <Badge variant="outline" className="capitalize">
                  {(store?.paymentStatus || "trial").replace(/_/g, " ")}
                </Badge>
              </div>

              <div className="space-y-1 text-left sm:text-right">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Trial End Date
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {authService.getTrialEndsAt()
                    ? new Date(
                        authService.getTrialEndsAt() as string,
                      ).toLocaleString()
                    : store?.trialEndsAt
                      ? new Date(store.trialEndsAt).toLocaleString()
                      : "Unknown"}
                </p>
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
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Choose Plan
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {(
                  [
                    {
                      key: "starter",
                      title: "Starter",
                      description: "Essentials for small teams.",
                    },
                    {
                      key: "pro",
                      title: "Pro",
                      description: "Advanced features for growing teams.",
                    },
                    {
                      key: "enterprise",
                      title: "Enterprise",
                      description: "Multi-location and custom workflows.",
                    },
                  ] as const
                ).map((plan) => (
                  <button
                    key={plan.key}
                    type="button"
                    onClick={() => setSelectedPlan(plan.key)}
                    className={`cursor-pointer rounded-lg border p-4 text-left transition-all hover:border-blue-500 ${
                      selectedPlan === plan.key
                        ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <h4 className="text-xs font-bold uppercase text-gray-400">
                      {plan.title}
                    </h4>
                    <div className="mt-1">{renderPlanPrice(plan.key)}</div>
                    <p className="mt-1 text-sm text-gray-600">
                      {plan.description}
                    </p>
                  </button>
                ))}
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
                  startSubscriptionMutation.mutate();
                }}
                disabled={startSubscriptionMutation.isPending}
              >
                {startSubscriptionMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Continue to Creem Checkout
                  </>
                )}
              </Button>

              <Button type="button" variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
