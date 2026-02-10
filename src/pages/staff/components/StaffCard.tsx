/**
 * Staff Card Component
 * Displays individual staff member information with actions
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
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
import type { StaffMember } from "@/types";

interface StaffCardProps {
  staff: StaffMember;
  storeId: string;
}

export function StaffCard({ staff, storeId }: StaffCardProps) {
  const queryClient = useQueryClient();
  const staffBasePath = "/staff";

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

  const initials = `${staff.firstName?.[0] || ""}${
    staff.lastName?.[0] || ""
  }`.toUpperCase();

  const displayName =
    staff.fullName?.trim() ||
    `${staff.firstName ?? ""} ${staff.lastName ?? ""}`.trim() ||
    staff.email ||
    "Name not set";

  const headingText = staff.title || displayName;

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
              <h3 className="font-semibold text-gray-900">{headingText}</h3>
              <p className="text-sm text-gray-600">{displayName}</p>
              {!staff.isVisible && (
                <Badge variant="secondary" className="text-xs mt-1">
                  Hidden
                </Badge>
              )}
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  toggleVisibilityMutation.isPending ||
                  deleteStaffMutation.isPending
                }
                className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Staff Member</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove{" "}
                  <span className="font-medium text-gray-900">
                    {staff.firstName} {staff.lastName}
                  </span>{" "}
                  from your staff? This will revoke their access and they will
                  no longer appear in your store.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteStaffMutation.mutate()}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
        {(staff.locationName || staff.locationId != null) && (
          <div className="text-sm">
            <span className="text-gray-600">Location: </span>
            <span className="text-gray-900">
              {staff.locationName || `ID ${staff.locationId}`}
            </span>
          </div>
        )}
      </CardContent>

      {/* Actions */}
      <CardFooter className="flex flex-wrap items-center gap-2">
        <Button
          asChild
          size="sm"
          variant={"outline"}
          disabled={
            toggleVisibilityMutation.isPending || deleteStaffMutation.isPending
          }
          className="flex-1"
        >
          <Link to={`${staffBasePath}/${staff.id}`}>View Details</Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={
                toggleVisibilityMutation.isPending ||
                deleteStaffMutation.isPending
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
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {staff.isVisible ? "Hide" : "Show"} Staff Member
              </AlertDialogTitle>
              <AlertDialogDescription>
                {staff.isVisible
                  ? `Are you sure you want to hide ${staff.firstName} from the booking widget? Customers won't be able to see or book with them.`
                  : `Show ${staff.firstName} in the booking widget so customers can see and book with them?`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => toggleVisibilityMutation.mutate()}
              >
                {staff.isVisible ? "Hide" : "Show"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
