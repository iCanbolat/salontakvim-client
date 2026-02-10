/**
 * Breadcrumbs Component
 * Shows current location in the app hierarchy
 */

import { Fragment } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  appointments: "Appointments",
  services: "Services",
  categories: "Categories",
  locations: "Locations",
  customers: "Customers",
  "staff-members": "Staff",
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
  const { overrides } = useBreadcrumb();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  // Don't show breadcrumbs on login/register pages
  if (pathSegments[0] === "login" || pathSegments[0] === "register") {
    return null;
  }

  const breadcrumbs: BreadcrumbItem[] = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/");

    // Check if there's a dynamic override for this path
    const overrideLabel = overrides[href];
    const label =
      overrideLabel ||
      routeLabels[segment] ||
      segment.charAt(0).toUpperCase() + segment.slice(1);
    return { label, href };
  });

  // Check if current page is dashboard
  const isDashboardPage = pathSegments[pathSegments.length - 1] === "dashboard";

  return (
    <nav
      className="flex items-center space-x-2 text-sm"
      aria-label="Breadcrumb"
    >
      {isDashboardPage ? null : (
        <>
          <Link
            to="/dashboard"
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
                  <span className="font-medium text-gray-900">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    to={item.href || "#"}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </Fragment>
            );
          })}
        </>
      )}
    </nav>
  );
}
