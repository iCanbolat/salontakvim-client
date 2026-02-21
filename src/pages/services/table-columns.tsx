/**
 * Services Table Columns
 */

import type { Service, Category } from "@/types";
import type { TableColumn } from "@/components/common/page-view";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Trash2 } from "lucide-react";

interface GetServiceColumnsProps {
  onToggleVisibility: (service: Service) => void;
  onDelete: (service: Service) => void;
}

export const getServiceColumns = ({
  onToggleVisibility,
  onDelete,
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
      <div className="flex items-center justify-end gap-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(service);
          }}
          title={service.isVisible ? "Hide Service" : "Show Service"}
        >
          {service.isVisible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(service);
          }}
          title="Delete Service"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
    cellClassName: "text-right",
  },
];

interface GetCategoryColumnsProps {
  onToggleVisibility: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export const getCategoryColumns = ({
  onToggleVisibility,
  onDelete,
}: GetCategoryColumnsProps): TableColumn<Category>[] => [
  {
    key: "name",
    header: "Category",
    render: (category) => (
      <div className="flex items-center gap-2">
        {category.color && (
          <span
            className="h-3 w-3 rounded-full border border-border"
            style={{ backgroundColor: category.color }}
          />
        )}
        <span className="font-medium">{category.name}</span>
      </div>
    ),
  },
  {
    key: "description",
    header: "Description",
    render: (category) => (
      <span className="text-sm text-muted-foreground line-clamp-1">
        {category.description || "-"}
      </span>
    ),
    hideOnMobile: true,
  },
  {
    key: "visibility",
    header: "Visibility",
    render: (category) => (
      <span className="text-sm font-medium">
        {category.isVisible ? "Visible" : "Hidden"}
      </span>
    ),
  },
  {
    key: "actions",
    header: "",
    render: (category) => (
      <div className="flex items-center justify-end gap-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(category);
          }}
          title={category.isVisible ? "Hide Category" : "Show Category"}
        >
          {category.isVisible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(category);
          }}
          title="Delete Category"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
    cellClassName: "text-right",
  },
];
