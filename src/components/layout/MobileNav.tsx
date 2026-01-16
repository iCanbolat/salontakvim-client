/**
 * Mobile Navigation Component
 * Slide-out navigation drawer for mobile devices
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
  UserCog,
  FileText,
} from "lucide-react";
import { useAuth } from "@/contexts";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: Array<"admin" | "staff">;
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
    label: "My Schedule",
    href: "/staff/schedule",
    icon: Clock,
    roles: ["staff"],
  },
  {
    label: "Time Off",
    href: "/staff/time-off",
    icon: UserCog,
    roles: ["staff"],
  },
  {
    label: "Profile",
    href: "/staff/profile",
    icon: UserCircle,
    roles: ["staff"],
  },
];

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const { user } = useAuth();

  const navItems = user?.role === "admin" ? adminNavItems : staffNavItems;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex flex-col h-full bg-white">
          {/* Logo & Close Button */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">SalonTakvim</h1>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role} Panel
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="space-y-1 px-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )
                  }
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </ScrollArea>

          {/* User Info */}
          <Separator />
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.firstName || "User"}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-gray-600 font-medium text-sm">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
