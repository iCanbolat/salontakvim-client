/**
 * Invitation Card Component
 * Displays staff invitation information with actions
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { staffService } from "@/services";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { StaffInvitation } from "@/types";

interface InvitationCardProps {
  invitation: StaffInvitation;
  storeId: string;
}

export function InvitationCard({ invitation, storeId }: InvitationCardProps) {
  const queryClient = useQueryClient();

  // Delete invitation mutation
  const deleteInvitationMutation = useMutation({
    mutationFn: async () =>
      staffService.deleteInvitation(storeId, invitation.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["staff-invitations", storeId],
      });
    },
  });

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Icon */}
            <div className="shrink-0">
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
            </div>

            {/* Email and Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {invitation.email}
                </p>
                {invitation.role && (
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase font-bold py-0 h-4"
                  >
                    {invitation.role}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                <span>
                  Invited{" "}
                  {format(new Date(invitation.createdAt), "MMM d, yyyy")}
                </span>
                {invitation.expiresAt && (
                  <>
                    <span>•</span>
                    <span className="text-orange-600 font-medium">
                      Expires{" "}
                      {format(new Date(invitation.expiresAt), "MMM d, yyyy")}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Delete Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={deleteInvitationMutation.isPending}
                  className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Invitation</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete the invitation for{" "}
                    <span className="font-medium text-gray-900">
                      {invitation.email}
                    </span>
                    ? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteInvitationMutation.mutate()}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
