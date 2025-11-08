/**
 * Header Component
 * Shows breadcrumbs, user menu, and mobile menu button
 */

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./UserMenu";
import { Breadcrumbs } from "./Breadcrumbs";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Mobile Menu Button + Breadcrumbs */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <Breadcrumbs />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications (Future)
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          */}

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
