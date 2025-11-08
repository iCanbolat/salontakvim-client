/**
 * Invite Staff Dialog Component
 * Form for inviting new staff members via email
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Loader2 } from "lucide-react";
import { staffService } from "@/services";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { InviteStaffDto } from "@/types";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address").max(255, "Email too long"),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteStaffDialogProps {
  storeId: number;
  open: boolean;
  onClose: () => void;
}

export function InviteStaffDialog({
  storeId,
  open,
  onClose,
}: InviteStaffDialogProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    mode: "onChange",
  });

  // Invite staff mutation
  const inviteMutation = useMutation({
    mutationFn: async (data: InviteStaffDto) =>
      staffService.inviteStaff(storeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["staff-invitations", storeId],
      });
      reset();
      onClose();
    },
  });

  const onSubmit = (data: InviteFormData) => {
    inviteMutation.mutate(data);
  };

  const handleClose = () => {
    if (!inviteMutation.isPending) {
      reset();
      inviteMutation.reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Staff Member</DialogTitle>
          <DialogDescription>
            Send an invitation email to a new team member. They will receive a
            link to join your store.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="staff@example.com"
                className="pl-9"
                {...register("email")}
                disabled={inviteMutation.isPending}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Error Alert */}
          {inviteMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to send invitation. Please try again.
              </AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {inviteMutation.isSuccess && (
            <Alert>
              <AlertDescription>Invitation sent successfully!</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={inviteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || inviteMutation.isPending}
            >
              {inviteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Send Invitation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
