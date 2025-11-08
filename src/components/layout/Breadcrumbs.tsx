/**
 * Breadcrumbs Component
 * Shows current location in the app hierarchy
 */

import { Fragment } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const routeLabels: Record<string, string> = {
  admin: "Admin",
  staff: "Staff",
  dashboard: "Dashboard",
  appointments: "Appointments",
  services: "Services",
  categories: "Categories",
  locations: "Locations",
  customers: "Customers",
  widget: "Widget Settings",
  analytics: "Analytics",
  notifications: "Notifications",
  settings: "Settings",
  schedule: "My Schedule",
  "time-off": "Time Off",
  profile: "Profile",
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  // Generate breadcrumb items
  const breadcrumbs: BreadcrumbItem[] = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    const label =
      routeLabels[segment] ||
      segment.charAt(0).toUpperCase() + segment.slice(1);
    return { label, href };
  });

  // Don't show breadcrumbs on login/register pages
  if (pathSegments[0] === "login" || pathSegments[0] === "register") {
    return null;
  }

  return (
    <nav
      className="flex items-center space-x-2 text-sm"
      aria-label="Breadcrumb"
    >
      <Link
        to={
          pathSegments[0] === "admin" ? "/admin/dashboard" : "/staff/dashboard"
        }
        className="text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Home</span>
      </Link>

      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <Fragment key={item.href}>
            <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
            {isLast ? (
              <span className="font-medium text-gray-900">{item.label}</span>
            ) : (
              <Link
                to={item.href || "#"}
                className={cn(
                  "text-gray-500 hover:text-gray-700 transition-colors",
                  index === 0 && "hidden sm:inline" // Hide role name on mobile
                )}
              >
                {item.label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
