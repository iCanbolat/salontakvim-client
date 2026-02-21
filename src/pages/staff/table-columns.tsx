import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import type { TableColumn } from "@/components/common/page-view";
import type { StaffMember } from "@/types";

export const getStaffTableColumns = (actions: {
  onToggleVisibility: (id: string, isVisible: boolean) => void;
  onDelete: (id: string) => void;
}): TableColumn<StaffMember>[] => [
  {
    key: "name",
    header: "Staff",
    render: (staff) => (
      <div className="flex flex-col">
        <span className="font-medium">
          {staff.fullName ||
            `${staff.firstName ?? ""} ${staff.lastName ?? ""}`.trim() ||
            staff.email}
        </span>
        {staff.title && (
          <span className="text-sm text-muted-foreground line-clamp-1">
            {staff.title}
          </span>
        )}
      </div>
    ),
  },
  {
    key: "email",
    header: "Email",
    render: (staff) => <span className="text-sm">{staff.email || "-"}</span>,
    hideOnMobile: true,
  },
  {
    key: "location",
    header: "Location",
    render: (staff) => (
      <span className="text-sm">{staff.locationName || "-"}</span>
    ),
    hideOnMobile: true,
    hideOnTablet: true,
  },
  {
    key: "visibility",
    header: "Visibility",
    render: (staff) => (
      <Badge
        variant={staff.isVisible ? "secondary" : "outline"}
        className="text-xs"
      >
        {staff.isVisible ? "Visible" : "Hidden"}
      </Badge>
    ),
    hideOnTablet: true,
  },
  {
    key: "actions",
    header: "",
    render: (staff) => (
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            actions.onToggleVisibility(staff.id, !staff.isVisible);
          }}
          title={staff.isVisible ? "Hide staff" : "Show staff"}
        >
          {staff.isVisible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={(e) => {
            e.stopPropagation();
            if (
              window.confirm(
                "Are you sure you want to remove this staff member?",
              )
            ) {
              actions.onDelete(staff.id);
            }
          }}
          title="Remove staff"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
    cellClassName: "text-right",
  },
];
