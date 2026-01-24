/**
 * Invite Staff Dialog Component
 * Form for inviting new staff members via email
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { staffService, locationService } from "@/services";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { InviteStaffDto } from "@/types";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address").max(255, "Email too long"),
  title: z.string().max(255, "Title too long").optional(),
  locationId: z.string().min(1, "Location is required"),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteStaffDialogProps {
  storeId: string;
  open: boolean;
  onClose: () => void;
}

export function InviteStaffDialog({
  storeId,
  open,
  onClose,
}: InviteStaffDialogProps) {
  const queryClient = useQueryClient();
  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ["locations", storeId],
    queryFn: () => locationService.getLocations(storeId),
    enabled: !!storeId && storeId !== "0",
  });

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      title: "",
      locationId: "",
    },
  });

  // Invite staff mutation
  const inviteMutation = useMutation({
    mutationFn: async (data: InviteStaffDto) =>
      staffService.inviteStaff(storeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["staff-invitations", storeId],
      });
      toast.success("Invitation sent successfully!");
      form.reset();
      onClose();
    },
  });

  const onSubmit = (data: InviteFormData) => {
    inviteMutation.mutate(data);
  };

  const handleClose = () => {
    if (!inviteMutation.isPending) {
      form.reset();
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

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0"
          >
            <DialogBody className="space-y-4">
              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Email Address <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="staff@example.com"
                          className="pl-9"
                          {...field}
                          disabled={inviteMutation.isPending}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location Field */}
              <FormField
                control={form.control}
                name="locationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Location <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={inviteMutation.isPending || locationsLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(locations || []).map((location) => (
                          <SelectItem
                            key={location.id}
                            value={String(location.id)}
                          >
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Title Field */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Hair Stylist"
                        {...field}
                        disabled={inviteMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  <AlertDescription>
                    Invitation sent successfully!
                  </AlertDescription>
                </Alert>
              )}
            </DialogBody>

            <DialogFooter>
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
                disabled={!form.formState.isValid || inviteMutation.isPending}
              >
                {inviteMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
