import { Button } from "@/components/ui/button";
import type { TableColumn } from "@/components/common/page-view";
import type { Location } from "@/types";

interface GetLocationColumnsProps {
  onEdit: (location: Location) => void;
}

export const getLocationColumns = ({
  onEdit,
}: GetLocationColumnsProps): TableColumn<Location>[] => [
  {
    key: "name",
    header: "Location",
    render: (location) => (
      <div className="flex flex-col gap-1">
        <span className="font-medium text-gray-900">{location.name}</span>
        <span className="text-xs text-muted-foreground">
          {location.address}
        </span>
      </div>
    ),
  },
  {
    key: "details",
    header: "City / State",
    render: (location) => (
      <span className="text-sm">
        {location.city}, {location.state}
      </span>
    ),
    hideOnMobile: true,
  },
  {
    key: "status",
    header: "Status",
    render: () => (
      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
        Active
      </span>
    ),
    hideOnTablet: true,
  },
  {
    key: "actions",
    header: "",
    render: (location) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(location);
        }}
      >
        Edit
      </Button>
    ),
    cellClassName: "text-right",
  },
];
