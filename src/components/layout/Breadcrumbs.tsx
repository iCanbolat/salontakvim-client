/**
 * Breadcrumbs Component
 * Shows current location in the app hierarchy
 */

import { Fragment } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home, MoreHorizontal } from "lucide-react";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  if (isDashboardPage) {
    return null;
  }

  const lastItem = breadcrumbs[breadcrumbs.length - 1];
  const itemsToCollapse = breadcrumbs.slice(0, -1);

  return (
    <nav
      className="flex items-center space-x-1 sm:space-x-2 text-sm"
      aria-label="Breadcrumb"
    >
      {/* Desktop View */}
      <div className="hidden md:flex items-center space-x-2">
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
                <span className="font-medium text-gray-900 truncate max-w-[200px]">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href || "#"}
                  className="text-gray-500 hover:text-gray-700 transition-colors truncate max-w-[150px]"
                >
                  {item.label}
                </Link>
              )}
            </Fragment>
          );
        })}
      </div>

      {/* Mobile View */}
      <div className="flex md:hidden items-center space-x-1.5">
        <Link
          to="/dashboard"
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Home className="h-4 w-4" />
          <span className="sr-only">Home</span>
        </Link>

        {itemsToCollapse.length > 0 && (
          <>
            <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center text-gray-500 hover:text-gray-700 transition-colors px-1 py-0.5 rounded hover:bg-gray-100">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {itemsToCollapse.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link to={item.href || "#"} className="w-full">
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        {lastItem && (
          <>
            <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="font-medium text-gray-900 truncate max-w-[120px]">
              {lastItem.label}
            </span>
          </>
        )}
      </div>
    </nav>
  );
}
