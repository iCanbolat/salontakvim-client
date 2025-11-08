/**
 * Metric Card Component
 * Displays a single KPI metric
 */

import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  iconColor?: string;
  iconBgColor?: string;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  iconColor = "text-blue-600",
  iconBgColor = "bg-blue-100",
}: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
              {trend && (
                <span
                  className={cn(
                    "text-sm font-medium",
                    trend.isPositive ? "text-green-600" : "text-red-600"
                  )}
                >
                  {trend.isPositive ? "+" : ""}
                  {trend.value}% {trend.label}
                </span>
              )}
            </div>
            {description && (
              <p className="mt-2 text-sm text-gray-500">{description}</p>
            )}
          </div>
          <div className={cn("p-3 rounded-lg", iconBgColor)}>
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
