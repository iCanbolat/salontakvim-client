/**
 * Staff Card Component
 * Displays individual staff member information with actions
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Briefcase,
  Clock,
  Calendar,
} from "lucide-react";
import { staffService } from "@/services";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { StaffMember } from "@/types";

interface StaffCardProps {
  staff: StaffMember;
  storeId: number;
  onEdit: (staff: StaffMember) => void;
  onAssignServices: (staff: StaffMember) => void;
  onManageSchedule: (staff: StaffMember) => void;
  onManageTimeOff: (staff: StaffMember) => void;
}

export function StaffCard({
  staff,
  storeId,
  onEdit,
  onAssignServices,
  onManageSchedule,
  onManageTimeOff,
}: StaffCardProps) {
  const queryClient = useQueryClient();

  // Toggle visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: async () =>
      staffService.updateStaffProfile(storeId, staff.id, {
        isVisible: !staff.isVisible,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", storeId] });
    },
  });

  // Delete staff mutation
  const deleteStaffMutation = useMutation({
    mutationFn: async () => staffService.deleteStaffMember(storeId, staff.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", storeId] });
    },
  });

  const handleToggleVisibility = () => {
    if (
      confirm(
        `${staff.isVisible ? "Hide" : "Show"} ${
          staff.firstName
        } from the booking widget?`
      )
    ) {
      toggleVisibilityMutation.mutate();
    }
  };

  const handleDelete = () => {
    if (
      confirm(
        `Are you sure you want to remove ${staff.firstName} ${staff.lastName} from your staff?`
      )
    ) {
      deleteStaffMutation.mutate();
    }
  };

  const initials = `${staff.firstName?.[0] || ""}${
    staff.lastName?.[0] || ""
  }`.toUpperCase();

  return (
    <Card className="flex flex-col relative">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-12 w-12">
              {staff.avatar && (
                <AvatarImage src={staff.avatar} alt={staff.firstName} />
              )}
              <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                {initials || "ST"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">
                {staff.firstName} {staff.lastName}
              </h3>
              {staff.title && (
                <p className="text-sm text-gray-600">{staff.title}</p>
              )}
              {!staff.isVisible && (
                <Badge variant="secondary" className="text-xs mt-1">
                  Hidden
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={
              toggleVisibilityMutation.isPending ||
              deleteStaffMutation.isPending
            }
            className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 flex-1">
        {/* Email */}
        <div className="text-sm">
          <span className="text-gray-600">Email: </span>
          <span className="text-gray-900">{staff.email}</span>
        </div>

        {/* Bio */}
        {staff.bio && (
          <div className="text-sm">
            <p className="text-gray-700 line-clamp-2">{staff.bio}</p>
          </div>
        )}

        {/* Location */}
        {staff.locationId && (
          <div className="text-sm">
            <span className="text-gray-600">Location ID: </span>
            <span className="text-gray-900">{staff.locationId}</span>
          </div>
        )}
      </CardContent>

      {/* Actions */}
      <CardFooter className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(staff)}
          disabled={
            toggleVisibilityMutation.isPending || deleteStaffMutation.isPending
          }
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onAssignServices(staff)}
          disabled={
            toggleVisibilityMutation.isPending || deleteStaffMutation.isPending
          }
        >
          <Briefcase className="h-4 w-4 mr-1" />
          Services
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onManageSchedule(staff)}
          disabled={
            toggleVisibilityMutation.isPending || deleteStaffMutation.isPending
          }
        >
          <Clock className="h-4 w-4 mr-1" />
          Schedule
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onManageTimeOff(staff)}
          disabled={
            toggleVisibilityMutation.isPending || deleteStaffMutation.isPending
          }
        >
          <Calendar className="h-4 w-4 mr-1" />
          Time Off
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleVisibility}
          disabled={
            toggleVisibilityMutation.isPending || deleteStaffMutation.isPending
          }
        >
          {staff.isVisible ? (
            <>
              <EyeOff className="h-4 w-4 mr-1" />
              Hide
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-1" />
              Show
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
