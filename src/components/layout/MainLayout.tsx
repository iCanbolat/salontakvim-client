/**
 * Main Layout Component
 * Provides the main app layout with sidebar, header, and content area
 */

import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { BreadcrumbProvider } from "@/contexts/BreadcrumbContext";
import { cn } from "@/lib/utils";

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { pathname } = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <BreadcrumbProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Navigation */}
        <MobileNav isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Desktop Sidebar */}
        <div
          className={cn(
            "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 z-20",
            isSidebarCollapsed ? "lg:w-20" : "lg:w-64"
          )}
        >
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>

        {/* Main Content Area */}
        <div
          className={cn(
            "flex flex-col min-h-screen transition-all duration-300",
            isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
          )}
        >
          {/* Header */}
          <Header onMenuClick={() => setSidebarOpen(true)} />

          {/* Page Content */}
          <main className="flex-1">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Outlet />
              </div>
            </div>
          </main>

          {/* Footer (Optional) */}
          <footer className="bg-white border-t border-gray-200 py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <p className="text-center text-sm text-gray-500">
                © {new Date().getFullYear()} SalonTakvim. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </BreadcrumbProvider>
  );
}
