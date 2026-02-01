import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CustomerProfileContent } from "./components";
import { useCustomerDetails } from "./hooks/useCustomerDetails";

export function CustomerDetails() {
  const navigate = useNavigate();
  const { profile, store, isLoading, profileError, isValidCustomerId } =
    useCustomerDetails();

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Details</h1>
          <p className="text-gray-600 mt-1">
            Review this customer's activity, spending, and appointment history.
          </p>
        </div>
        <Button
          size="sm"
          className="h-8 w-fit transition-all hover:bg-gray-100"
          variant="outline"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Customers
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : profile && store ? (
        <CustomerProfileContent profile={profile} storeId={store.id} />
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
