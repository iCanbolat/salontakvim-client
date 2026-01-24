import { Badge } from "@/components/ui/badge";
import type { TableColumn } from "@/components/common/page-view";
import type { StaffMember } from "@/types";

export const getStaffTableColumns = (): TableColumn<StaffMember>[] => [
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
      <Badge variant="outline" className="text-xs">
        {staff.isVisible ? "Visible" : "Hidden"}
      </Badge>
    ),
    hideOnTablet: true,
  },
];
