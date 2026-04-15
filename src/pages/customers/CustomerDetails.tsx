import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, AlertCircle, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PageLoader } from "@/components/common/PageLoader";
import { customerService } from "@/services";
import { qk } from "@/lib/query-keys";
import { CustomerProfileContent } from "./components";
import { useCustomerDetails } from "./hooks/useCustomerDetails";
import { toast } from "sonner";

const GENERAL_NOTE_MAX_LENGTH = 4000;

export function CustomerDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile, store, isLoading, profileError, isValidCustomerId } =
    useCustomerDetails();

  const [generalNote, setGeneralNote] = useState("");
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);

  useEffect(() => {
    if (!isNoteDialogOpen) {
      setGeneralNote(profile?.customer.generalNote ?? "");
    }
  }, [profile?.customer.id, profile?.customer.generalNote, isNoteDialogOpen]);

  const saveGeneralNoteMutation = useMutation({
    mutationFn: async (noteValue: string) => {
      if (!store?.id || !profile?.customer.id) {
        throw new Error("Store or customer information is missing");
      }

      return customerService.updateCustomer(store.id, profile.customer.id, {
        generalNote: noteValue,
      });
    },
    onSuccess: async () => {
      toast.success("General note saved");
      setIsNoteDialogOpen(false);

      await queryClient.invalidateQueries({
        queryKey: qk.customerProfile(store?.id, profile?.customer.id),
      });
      await queryClient.invalidateQueries({
        queryKey: qk.customers(store?.id),
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to save customer note",
      );
    },
  });

  const initialGeneralNote = profile?.customer.generalNote ?? "";
  const hasGeneralNoteChanges =
    generalNote.trim() !== initialGeneralNote.trim();
  const isGeneralNoteTooLong = generalNote.length > GENERAL_NOTE_MAX_LENGTH;

  const handleSaveGeneralNote = () => {
    if (
      !hasGeneralNoteChanges ||
      isGeneralNoteTooLong ||
      saveGeneralNoteMutation.isPending
    ) {
      return;
    }

    saveGeneralNoteMutation.mutate(generalNote);
  };

  const handleResetGeneralNote = () => {
    setGeneralNote(initialGeneralNote);
  };

  const handleOpenNoteDialog = () => {
    setGeneralNote(initialGeneralNote);
    setIsNoteDialogOpen(true);
  };

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
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            className="h-8 w-fit transition-all hover:bg-gray-100"
            variant="outline"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Customers
          </Button>

          <Button
            size="sm"
            className="h-8 w-fit"
            variant="outline"
            onClick={handleOpenNoteDialog}
            disabled={!profile || !store}
          >
            <FileText className="h-4 w-4" />
            General Note
          </Button>
        </div>
      </div>

      {isLoading ? (
        <PageLoader className="h-64" />
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

      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              General Note
            </DialogTitle>
            <DialogDescription>
              Keep one ongoing note for this customer.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-3">
            <Textarea
              value={generalNote}
              onChange={(event) => setGeneralNote(event.target.value)}
              placeholder="Write customer-specific notes here..."
              className="min-h-40"
              maxLength={GENERAL_NOTE_MAX_LENGTH}
            />
            <p className="text-xs text-muted-foreground text-right">
              {generalNote.length}/{GENERAL_NOTE_MAX_LENGTH}
            </p>
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNoteDialogOpen(false)}
              disabled={saveGeneralNoteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleResetGeneralNote}
              disabled={
                !hasGeneralNoteChanges || saveGeneralNoteMutation.isPending
              }
            >
              Reset
            </Button>
            <Button
              onClick={handleSaveGeneralNote}
              disabled={
                !hasGeneralNoteChanges ||
                isGeneralNoteTooLong ||
                saveGeneralNoteMutation.isPending
              }
            >
              {saveGeneralNoteMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save Note"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
