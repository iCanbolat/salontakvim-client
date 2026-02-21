import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import type { TableColumn } from "@/components/common/page-view";
import type { Location } from "@/types";

interface GetLocationColumnsProps {
  onToggleVisibility: (id: string, isVisible: boolean) => void;
  onDelete: (id: string) => void;
}

export const getLocationColumns = ({
  onToggleVisibility,
  onDelete,
}: GetLocationColumnsProps): TableColumn<Location>[] => [
  {
    key: "name",
    header: "Location",
    render: (location) => (
      <div className="flex flex-col gap-1">
        <span className="font-medium text-gray-900">{location.name}</span>
        <span className="text-xs text-muted-foreground line-clamp-1">
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
    key: "visibility",
    header: "Visibility",
    render: (location) => (
      <Badge
        variant={location.isVisible ? "secondary" : "outline"}
        className="text-xs"
      >
        {location.isVisible ? "Visible" : "Hidden"}
      </Badge>
    ),
    hideOnTablet: true,
  },
  {
    key: "actions",
    header: "",
    render: (location) => (
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(location.id, !location.isVisible);
          }}
          title={location.isVisible ? "Hide location" : "Show location"}
        >
          {location.isVisible ? (
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
              window.confirm("Are you sure you want to delete this location?")
            ) {
              onDelete(location.id);
            }
          }}
          title="Delete location"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
    cellClassName: "text-right",
  },
];
