import { useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { storeService, customerService } from "@/services";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CustomerProfileContent } from "@/components/customers";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";

// UUID v4 regex pattern
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function CustomerDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { customerId } = useParams<{ customerId: string }>();
  const { setBreadcrumbLabel, clearBreadcrumbLabel } = useBreadcrumb();

  const isValidCustomerId = !!customerId && UUID_REGEX.test(customerId);

  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
  });

  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ["customer-profile", store?.id, customerId],
    queryFn: () => customerService.getCustomerProfile(store!.id, customerId!),
    enabled: !!store?.id && isValidCustomerId,
    retry: 1,
  });

  const isLoading = storeLoading || profileLoading;

  // Update breadcrumb label when profile loads
  useEffect(() => {
    if (profile?.customer) {
      const customerName =
        `${profile.customer.firstName || ""} ${
          profile.customer.lastName || ""
        }`.trim() || "Unnamed Customer";
      setBreadcrumbLabel(location.pathname, customerName);
    }

    return () => {
      clearBreadcrumbLabel(location.pathname);
    };
  }, [profile, location.pathname, setBreadcrumbLabel, clearBreadcrumbLabel]);

  if (!isValidCustomerId) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Invalid customer identifier.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          className="px-0 text-blue-600 hover:text-blue-700"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to customers
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Details</h1>
          <p className="text-gray-600 mt-1">
            Review this customer's activity, spending, and appointment history.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : profile ? (
        <CustomerProfileContent profile={profile} />
      ) : profileError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load customer information. Please try again later.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Customer could not be found.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
