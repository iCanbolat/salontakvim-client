/**
 * Invitation Card Component
 * Displays staff invitation information with actions
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Mail,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { staffService } from "@/services";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { StaffInvitation } from "@/types";

interface InvitationCardProps {
  invitation: StaffInvitation;
  storeId: string;
}

const statusConfig: Record<
  StaffInvitation["status"],
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    variant: "default" | "secondary" | "destructive";
    color: string;
  }
> = {
  pending: {
    icon: Clock,
    label: "Pending",
    variant: "secondary",
    color: "text-yellow-600",
  },
  accepted: {
    icon: CheckCircle,
    label: "Accepted",
    variant: "default",
    color: "text-green-600",
  },
  expired: {
    icon: AlertCircle,
    label: "Expired",
    variant: "destructive",
    color: "text-red-600",
  },
  cancelled: {
    icon: XCircle,
    label: "Cancelled",
    variant: "secondary",
    color: "text-gray-600",
  },
};

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

  const handleDelete = () => {
    if (
      confirm(
        `Are you sure you want to delete the invitation for ${invitation.email}?`
      )
    ) {
      deleteInvitationMutation.mutate();
    }
  };

  const config = statusConfig[invitation.status];
  const StatusIcon = config.icon;

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Icon */}
            <div className="shrink-0">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>

            {/* Email */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {invitation.email}
              </p>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                <span>
                  Invited{" "}
                  {format(new Date(invitation.createdAt), "MMM d, yyyy")}
                </span>
                {invitation.expiresAt && (
                  <>
                    <span>•</span>
                    <span>
                      Expires{" "}
                      {format(new Date(invitation.expiresAt), "MMM d, yyyy")}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <Badge variant={config.variant} className="shrink-0">
              <StatusIcon className={`h-3 w-3 mr-1 ${config.color}`} />
              {config.label}
            </Badge>

            {/* Delete Button */}
            {invitation.status === "pending" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleteInvitationMutation.isPending}
                className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
