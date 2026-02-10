import { useMemo } from "react";
import { Layers, Loader2 } from "lucide-react";
import type { Service } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AssignedServicesListProps {
  services?: Service[];
  isLoading?: boolean;
  onManageAssignments?: () => void;
}

const currencyFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 0,
});

export function AssignedServicesList({
  services,
  isLoading,
  onManageAssignments,
}: AssignedServicesListProps) {
  const groupedServices = useMemo(() => {
    if (!services?.length) {
      return [] as Array<{
        key: string;
        title: string;
        color?: string;
        position: number;
        services: Service[];
      }>;
    }

    const grouped = new Map<
      string,
      {
        key: string;
        title: string;
        color?: string;
        position: number;
        services: Service[];
      }
    >();

    services.forEach((service) => {
      const categoryId = service.categoryId?.toString() ?? "uncategorized";
      if (!grouped.has(categoryId)) {
        grouped.set(categoryId, {
          key: categoryId,
          title:
            service.categoryName ||
            (categoryId === "uncategorized"
              ? "Kategorisiz"
              : `Kategori #${categoryId}`),
          color: service.categoryColor,
          position: Number.MAX_SAFE_INTEGER,
          services: [],
        });
      }

      grouped.get(categoryId)!.services.push(service);
    });

    return Array.from(grouped.values())
      .map((group) => ({
        ...group,
        services: [...group.services].sort(
          (a, b) => (a.position ?? 0) - (b.position ?? 0),
        ),
      }))
      .sort((a, b) => a.position - b.position);
  }, [services]);

  const formatPrice = (price: string) => {
    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice)) {
      return price;
    }
    return currencyFormatter.format(numericPrice);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!services || services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-gray-200 py-12 text-center">
        <div className="rounded-full bg-blue-50 p-3 text-blue-600">
          <Layers className="h-6 w-6" />
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">
            Henüz atanan servis yok
          </p>
          <p className="text-sm text-gray-600">
            Çalışanın sağlayabileceği servisleri belirlemek için aşağıdaki
            butonu kullanın.
          </p>
        </div>
        {onManageAssignments && (
          <Button size="sm" onClick={onManageAssignments}>
            Servis Ata
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        {onManageAssignments && (
          <Button variant="outline" size="sm" onClick={onManageAssignments}>
            Manage Services
          </Button>
        )}
      </div>

      {groupedServices.map((group) => (
        <div key={group.key} className="space-y-3">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-white"
              style={{
                backgroundColor: group.color || "#F3F4F6",
                color: group.color ? "white" : "#4B5563",
              }}
            >
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {group.title}
              </p>
              <p className="text-xs text-gray-500">
                {group.services.length} services
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {group.services.map((service) => (
              <Card key={service.id} className="min-w-[300px] flex-1">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {service.name}
                        </p>
                        {service.categoryColor && (
                          <span
                            className="h-3 w-3 rounded-full border border-gray-200"
                            style={{ backgroundColor: service.categoryColor }}
                            aria-label="service color"
                          />
                        )}
                      </div>
                      {service.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {service.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">
                      {formatPrice(service.price)}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    <Badge variant="outline">{service.duration} dk</Badge>
                    <Badge variant="outline">
                      Kapasite: {service.capacity}
                    </Badge>
                    {service.allowRecurring && (
                      <Badge variant="outline">Tekrarlı</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default AssignedServicesList;
