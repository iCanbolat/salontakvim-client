/**
 * Staff Card Component
 * Displays individual staff member information with actions
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { staffService } from "@/services";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { StaffMember } from "@/types";
import { qk } from "@/lib/query-keys";
import { EntityCard } from "@/components/common/EntityCard";
import { useConfirmDialog } from "@/contexts/ConfirmDialogProvider";
import { StaffProfileDialog } from "./StaffProfileDialog";

interface StaffCardProps {
  staff: StaffMember;
  storeId: string;
}

export function StaffCard({ staff, storeId }: StaffCardProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { confirm } = useConfirmDialog();
  const staffBasePath = "/staff";

  // Toggle visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: async () =>
      staffService.updateStaffProfile(storeId, staff.id, {
        isVisible: !staff.isVisible,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.staff(storeId) });
    },
  });

  // Delete staff mutation
  const deleteStaffMutation = useMutation({
    mutationFn: async () => staffService.deleteStaffMember(storeId, staff.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.staff(storeId) });
    },
  });

  const initials = `${staff.firstName?.[0] || ""}${
    staff.lastName?.[0] || ""
  }`.toUpperCase();

  const displayName =
    staff.fullName?.trim() ||
    `${staff.firstName ?? ""} ${staff.lastName ?? ""}`.trim() ||
    staff.email ||
    "Name not set";

  const headingText = staff.title || displayName;

  const handleDelete = () => {
    void confirm({
      title: "Remove staff member",
      description: `Remove ${displayName} from staff? This will revoke their access to the store.`,
      confirmText: "Remove",
      variant: "destructive",
    }).then((isConfirmed) => {
      if (isConfirmed) {
        deleteStaffMutation.mutate();
      }
    });
  };

  const handleToggleVisibility = async () => {
    const message = staff.isVisible
      ? `Hide ${displayName} from the booking widget? Customers will not be able to book with this staff member.`
      : `Show ${displayName} in the booking widget so customers can book with them?`;

    const isConfirmed = await confirm({
      title: staff.isVisible ? "Hide staff member" : "Show staff member",
      description: message,
      confirmText: staff.isVisible ? "Hide" : "Show",
      variant: "destructive",
    });

    if (isConfirmed) {
      toggleVisibilityMutation.mutate();
    }
  };

  return (
    <>
      <EntityCard
        title={headingText}
        description={displayName}
        headerContent={
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {staff.avatar && (
                <AvatarImage src={staff.avatar} alt={displayName} />
              )}
              <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                {initials || "ST"}
              </AvatarFallback>
            </Avatar>
            <Badge variant="outline" className="capitalize">
              {staff.role}
            </Badge>
          </div>
        }
        isVisible={staff.isVisible}
        onCardClick={() => navigate(`${staffBasePath}/${staff.id}`)}
        onEdit={() => setIsEditDialogOpen(true)}
        onToggleVisibility={handleToggleVisibility}
        onDelete={handleDelete}
        isEditDisabled={
          toggleVisibilityMutation.isPending || deleteStaffMutation.isPending
        }
        isToggling={toggleVisibilityMutation.isPending}
        isDeleting={deleteStaffMutation.isPending}
        toggleTitle={staff.isVisible ? "Hide Staff" : "Show Staff"}
        deleteTitle="Remove Staff"
      >
        <div className="flex-1 space-y-3">
          <div className="text-sm">
            <span className="text-gray-600">Email: </span>
            <span className="text-gray-900">{staff.email}</span>
          </div>

          {staff.bio && (
            <div className="text-sm">
              <p className="line-clamp-2 text-gray-700">{staff.bio}</p>
            </div>
          )}

          {(staff.locationName || staff.locationId != null) && (
            <div className="text-sm">
              <span className="text-gray-600">Location: </span>
              <span className="text-gray-900">
                {staff.locationName || `ID ${staff.locationId}`}
              </span>
            </div>
          )}
        </div>
      </EntityCard>

      {isEditDialogOpen && (
        <StaffProfileDialog
          storeId={storeId}
          staff={staff}
          open={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
        />
      )}
    </>
  );
}
