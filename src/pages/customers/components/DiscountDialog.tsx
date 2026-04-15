import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Tag,
  Loader2,
  Plus,
  Percent,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { format, addDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { couponService } from "@/services";
import type { CustomerWithStats, CreateCouponDto } from "@/types";
import { toast } from "sonner";
import { qk } from "@/lib/query-keys";

interface DiscountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCustomers: CustomerWithStats[];
  storeId: string;
}

type DiscountType = "percentage" | "fixed_amount";

interface NewCouponForm {
  code: string;
  name: string;
  description: string;
  type: DiscountType;
  value: string;
  minPurchaseAmount: string;
  maxDiscountAmount: string;
  usageLimitPerCustomer: string;
  validDays: string;
  notifyCustomers: boolean;
}

const generateCouponCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export function DiscountDialog({
  isOpen,
  onClose,
  selectedCustomers,
  storeId,
}: DiscountDialogProps) {
  const [activeTab, setActiveTab] = useState<"existing" | "new">("new");
  const [selectedCouponId, setSelectedCouponId] = useState<string>("");
  const [notifyForExisting, setNotifyForExisting] = useState(false);
  const [form, setForm] = useState<NewCouponForm>({
    code: "",
    name: "",
    description: "",
    type: "percentage",
    value: "10",
    minPurchaseAmount: "",
    maxDiscountAmount: "",
    usageLimitPerCustomer: "1",
    validDays: "30",
    notifyCustomers: true,
  });

  const queryClient = useQueryClient();

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setForm((prev) => ({
        ...prev,
        code: generateCouponCode(),
      }));
      setSelectedCouponId("");
      setActiveTab("new");
    }
  }, [isOpen]);

  // Fetch existing coupons
  const { data: existingCoupons, isLoading: couponsLoading } = useQuery({
    queryKey: qk.coupons(storeId),
    queryFn: () => couponService.getCoupons(storeId, { isActive: true }),
    enabled: isOpen && !!storeId,
  });

  // Create new coupon and assign mutation
  const createAndAssignMutation = useMutation({
    mutationFn: async () => {
      const validFrom = new Date();
      const validUntil = addDays(validFrom, parseInt(form.validDays) || 30);

      const couponData: CreateCouponDto = {
        code: form.code.toUpperCase(),
        name:
          form.name ||
          `${form.value}${form.type === "percentage" ? "%" : "₺"} Discount`,
        description: form.description || undefined,
        type: form.type,
        value: parseFloat(form.value),
        minPurchaseAmount: form.minPurchaseAmount
          ? parseFloat(form.minPurchaseAmount)
          : undefined,
        maxDiscountAmount: form.maxDiscountAmount
          ? parseFloat(form.maxDiscountAmount)
          : undefined,
        usageLimitPerCustomer: parseInt(form.usageLimitPerCustomer) || 1,
        validFrom: validFrom.toISOString(),
        validUntil: validUntil.toISOString(),
        isActive: true,
      };

      // Create coupon
      const newCoupon = await couponService.createCoupon(storeId, couponData);

      // Assign to customers
      await couponService.assignCouponToCustomers(storeId, newCoupon.id, {
        customerIds: selectedCustomers.map((c) => c.id),
        notifyCustomers: form.notifyCustomers,
      });

      return newCoupon;
    },
    onSuccess: (coupon) => {
      queryClient.invalidateQueries({ queryKey: qk.coupons(storeId) });
      toast.success(
        `Coupon "${coupon.code}" created and assigned to ${selectedCustomers.length} customers`,
      );
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
          "An error occurred while creating coupon",
      );
    },
  });

  // Assign existing coupon mutation
  const assignExistingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCouponId) throw new Error("No coupon selected");

      await couponService.assignCouponToCustomers(storeId, selectedCouponId, {
        customerIds: selectedCustomers.map((c) => c.id),
        notifyCustomers: notifyForExisting,
      });
    },
    onSuccess: () => {
      const coupon = existingCoupons?.find((c) => c.id === selectedCouponId);
      queryClient.invalidateQueries({ queryKey: qk.coupons(storeId) });
      toast.success(
        `Coupon "${coupon?.code}" assigned to ${selectedCustomers.length} customers`,
      );
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
          "An error occurred while assigning coupon",
      );
    },
  });

  const handleSubmit = () => {
    if (activeTab === "new") {
      if (!form.code.trim() || !form.value) {
        toast.error("Coupon code and value are required");
        return;
      }
      createAndAssignMutation.mutate();
    } else {
      if (!selectedCouponId) {
        toast.error("Please select a coupon");
        return;
      }
      assignExistingMutation.mutate();
    }
  };

  const isSubmitting =
    createAndAssignMutation.isPending || assignExistingMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Assign Discount Coupon</DialogTitle>
          <DialogDescription>
            Assign a discount coupon to {selectedCustomers.length} customers
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Selected customers preview */}
          <div className="space-y-2">
            <Label>Selected Customers</Label>
            <div className="flex flex-wrap gap-2">
              {selectedCustomers.slice(0, 5).map((customer) => (
                <div
                  key={customer.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs"
                >
                  {customer.firstName} {customer.lastName}
                </div>
              ))}
              {selectedCustomers.length > 5 && (
                <div className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                  +{selectedCustomers.length - 5} more
                </div>
              )}
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "existing" | "new")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">
                <Plus className="h-4 w-4 mr-1" />
                New Coupon
              </TabsTrigger>
              <TabsTrigger value="existing">
                <Tag className="h-4 w-4 mr-1" />
                Existing Coupon
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="space-y-4 mt-4">
              {/* Coupon Code */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Coupon Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={form.code}
                      onChange={(e) =>
                        setForm({ ...form, code: e.target.value.toUpperCase() })
                      }
                      placeholder="DISCOUNT10"
                      className="font-mono uppercase"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setForm({ ...form, code: generateCouponCode() })
                      }
                      title="Generate random code"
                    >
                      <Tag className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Coupon Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Welcome discount"
                  />
                </div>
              </div>

              {/* Discount Type and Value */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v: DiscountType) =>
                      setForm({ ...form, type: v })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4" />
                          Percentage (%)
                        </div>
                      </SelectItem>
                      <SelectItem value="fixed_amount">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Fixed Amount 
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="value">
                    Discount Value {form.type === "percentage" ? "(%)" : ""}
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    min="0"
                    max={form.type === "percentage" ? "100" : undefined}
                    value={form.value}
                    onChange={(e) =>
                      setForm({ ...form, value: e.target.value })
                    }
                    placeholder={form.type === "percentage" ? "10" : "50"}
                  />
                </div>
              </div>

              {/* Optional fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minPurchase">Min. Purchase Amount </Label>
                  <Input
                    id="minPurchase"
                    type="number"
                    min="0"
                    value={form.minPurchaseAmount}
                    onChange={(e) =>
                      setForm({ ...form, minPurchaseAmount: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </div>

                {form.type === "percentage" && (
                  <div className="space-y-2">
                    <Label htmlFor="maxDiscount">Max. Discount </Label>
                    <Input
                      id="maxDiscount"
                      type="number"
                      min="0"
                      value={form.maxDiscountAmount}
                      onChange={(e) =>
                        setForm({ ...form, maxDiscountAmount: e.target.value })
                      }
                      placeholder="Optional"
                    />
                  </div>
                )}
              </div>

              {/* Validity and Usage */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validDays">Validity Period (Days)</Label>
                  <Input
                    id="validDays"
                    type="number"
                    min="1"
                    value={form.validDays}
                    onChange={(e) =>
                      setForm({ ...form, validDays: e.target.value })
                    }
                    placeholder="30"
                  />
                  <p className="text-xs text-gray-500">
                    Expires:{" "}
                    {format(
                      addDays(new Date(), parseInt(form.validDays) || 30),
                      "d MMM yyyy",
                    )}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usageLimit">Usage Limit per Customer</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    min="1"
                    value={form.usageLimitPerCustomer}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        usageLimitPerCustomer: e.target.value,
                      })
                    }
                    placeholder="1"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Notes about the coupon..."
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* Notify customers */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label>Notify Customers</Label>
                  <p className="text-xs text-gray-500">
                    Send SMS/Email notification to selected customers
                  </p>
                </div>
                <Switch
                  checked={form.notifyCustomers}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, notifyCustomers: checked })
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="existing" className="space-y-4 mt-4">
              {couponsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : existingCoupons && existingCoupons.length > 0 ? (
                <>
                  <div className="space-y-2">
                    <Label>Select Coupon</Label>
                    <Select
                      value={selectedCouponId}
                      onValueChange={setSelectedCouponId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a coupon..." />
                      </SelectTrigger>
                      <SelectContent>
                        {existingCoupons.map((coupon) => (
                          <SelectItem key={coupon.id} value={coupon.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                {coupon.code}
                              </span>
                              <span>
                                {coupon.type === "percentage"
                                  ? `%${coupon.value}`
                                  : `${coupon.value}₺`}
                              </span>
                              <span className="text-gray-500 text-xs">
                                ({coupon.name})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedCouponId && (
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      {(() => {
                        const coupon = existingCoupons.find(
                          (c) => c.id === selectedCouponId,
                        );
                        if (!coupon) return null;
                        return (
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Discount:</span>
                              <span className="font-medium">
                                {coupon.type === "percentage"
                                  ? `%${coupon.value}`
                                  : `${coupon.value}₺`}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Validity:</span>
                              <span>
                                {format(
                                  new Date(coupon.validUntil),
                                  "d MMM yyyy",
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                Usage Limit:
                              </span>
                              <span>
                                {coupon.usageLimitPerCustomer} per customer
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Notify customers */}
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label>Notify Customers</Label>
                      <p className="text-xs text-gray-500">
                        Send SMS/Email notification to selected customers
                      </p>
                    </div>
                    <Switch
                      checked={notifyForExisting}
                      onCheckedChange={setNotifyForExisting}
                    />
                  </div>
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No active coupons found. You can create a new one.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (activeTab === "new" && (!form.code.trim() || !form.value)) ||
              (activeTab === "existing" && !selectedCouponId)
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <Tag className="h-4 w-4 mr-2" />
                Assign Coupon ({selectedCustomers.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
