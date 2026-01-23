/**
 * Sidebar Navigation Component
 * Shows navigation menu based on user role (admin/staff)
 */

import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Briefcase,
  Users,
  MapPin,
  UserCircle,
  Settings,
  BarChart3,
  Bell,
  Puzzle,
  Clock,
  ChevronLeft,
  ChevronRight,
  FileText,
  MessageSquare,
  UserCog,
} from "lucide-react";
import { useAuth } from "@/contexts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: Array<"admin" | "staff">;
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const adminNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    roles: ["admin"],
  },
  {
    label: "Appointments",
    href: "/admin/appointments",
    icon: Calendar,
    roles: ["admin"],
  },
  {
    label: "Services",
    href: "/admin/services",
    icon: Briefcase,
    roles: ["admin"],
  },
  {
    label: "Staff",
    href: "/admin/staff",
    icon: Users,
    roles: ["admin"],
  },
  {
    label: "Locations",
    href: "/admin/locations",
    icon: MapPin,
    roles: ["admin"],
  },
  {
    label: "Customers",
    href: "/admin/customers",
    icon: UserCircle,
    roles: ["admin"],
  },
  {
    label: "Files",
    href: "/admin/files",
    icon: FileText,
    roles: ["admin"],
  },
  {
    label: "Feedback",
    href: "/admin/feedback",
    icon: MessageSquare,
    roles: ["admin"],
  },
  {
    label: "Widget Settings",
    href: "/admin/widget",
    icon: Puzzle,
    roles: ["admin"],
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    roles: ["admin"],
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
    roles: ["admin"],
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
    roles: ["admin"],
  },
  {
    label: "My Profile",
    href: "/admin/profile",
    icon: UserCog,
    roles: ["admin"],
  },
];

const staffNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/staff/dashboard",
    icon: LayoutDashboard,
    roles: ["staff"],
  },
  {
    label: "My Appointments",
    href: "/staff/appointments",
    icon: Calendar,
    roles: ["staff"],
  },
  {
    label: "Customers",
    href: "/staff/customers",
    icon: Users,
    roles: ["staff"],
  },
  {
    label: "Files",
    href: "/staff/files",
    icon: FileText,
    roles: ["staff"],
  },
  {
    label: "Feedback",
    href: "/staff/feedback",
    icon: MessageSquare,
    roles: ["staff"],
  },
  {
    label: "Time Off",
    href: "/staff/schedule",
    icon: Clock,
    roles: ["staff"],
  },
  {
    label: "Profile",
    href: "/staff/profile",
    icon: UserCircle,
    roles: ["staff"],
  },
];

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const { user } = useAuth();

  const navItems = user?.role === "admin" ? adminNavItems : staffNavItems;

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300 relative",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-white shadow-sm z-10 hidden lg:flex"
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      {/* Logo */}
      <div
        className={cn(
          "flex items-center h-16 border-b border-gray-200 transition-all duration-300",
          isCollapsed ? "px-4 justify-center" : "px-6"
        )}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          {!isCollapsed && (
            <div className="transition-opacity duration-300 opacity-100">
              <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap">
                SalonTakvim
              </h1>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role} Panel
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className={cn("space-y-1 px-3", isCollapsed && "px-2")}>
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  isCollapsed ? "justify-center px-2" : "px-3",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )
              }
            >
              <item.icon
                className={cn(
                  "w-5 h-5 shrink-0 transition-transform duration-200",
                  !isCollapsed && "group-hover:scale-110"
                )}
              />
              {!isCollapsed && (
                <span className="transition-opacity duration-300 opacity-100 whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
}
