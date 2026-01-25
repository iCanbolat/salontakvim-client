/**
 * Services Table Columns
 */

import type { Service } from "@/types";
import type { TableColumn } from "@/components/common/page-view";
import { Button } from "@/components/ui/button";

interface GetServiceColumnsProps {
  onEdit: (service: Service) => void;
}

export const getServiceColumns = ({
  onEdit,
}: GetServiceColumnsProps): TableColumn<Service>[] => [
  {
    key: "name",
    header: "Service",
    render: (service) => (
      <div className="flex items-center gap-2">
        {service.categoryColor && (
          <span
            className="h-3 w-3 rounded-full border border-border"
            style={{ backgroundColor: service.categoryColor }}
            aria-label="Service color"
          />
        )}
        <div className="flex flex-col">
          <span className="font-medium">{service.name}</span>
          {service.description && (
            <span className="text-sm text-muted-foreground line-clamp-1">
              {service.description}
            </span>
          )}
        </div>
      </div>
    ),
  },
  {
    key: "duration",
    header: "Duration",
    render: (service) => <span>{service.duration} min</span>,
    hideOnMobile: true,
  },
  {
    key: "capacity",
    header: "Capacity",
    render: (service) => (
      <span>
        {service.capacity} {service.capacity === 1 ? "person" : "people"}
      </span>
    ),
    hideOnMobile: true,
  },
  {
    key: "price",
    header: "Price",
    render: (service) => (
      <span className="font-medium">₺{Number(service.price).toFixed(2)}</span>
    ),
    hideOnMobile: true,
    hideOnTablet: true,
  },
  {
    key: "visibility",
    header: "Visibility",
    render: (service) => (
      <span className="text-sm font-medium">
        {service.isVisible ? "Visible" : "Hidden"}
      </span>
    ),
    hideOnTablet: true,
  },
  {
    key: "actions",
    header: "",
    render: (service) => (
      <Button
        size="sm"
        variant="outline"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(service);
        }}
      >
        Edit
      </Button>
    ),
    cellClassName: "text-right",
  },
];
