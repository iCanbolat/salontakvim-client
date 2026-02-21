import { create } from "zustand";
import { persist } from "zustand/middleware";

export type GenericView = "grid" | "list";
export type AppointmentView = GenericView | "calendar";

interface UISettingsState {
  isSidebarCollapsed: boolean;
  pageViews: Record<string, GenericView | string>;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setPageView: (key: string, view: string) => void;
  // Deprecated: use setPageView('appointments', view) instead
  appointmentsView: AppointmentView;
  setAppointmentsView: (view: AppointmentView) => void;
}

export const useUISettingsStore = create<UISettingsState>()(
  persist(
    (set) => ({
      isSidebarCollapsed: false,
      pageViews: {
        appointments: "grid",
        customers: "list",
        staff: "grid",
        services: "grid",
      },
      appointmentsView: "grid", // Maintaining for now
      setSidebarCollapsed: (collapsed) =>
        set({ isSidebarCollapsed: collapsed }),
      toggleSidebarCollapsed: () =>
        set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setPageView: (key, view) =>
        set((state) => ({
          pageViews: { ...state.pageViews, [key]: view },
          // Keep sync with old property if key is appointments
          ...(key === "appointments"
            ? { appointmentsView: view as AppointmentView }
            : {}),
        })),
      setAppointmentsView: (view) =>
        set((state) => ({
          appointmentsView: view,
          pageViews: { ...state.pageViews, appointments: view },
        })),
    }),
    {
      name: "ui-settings",
      partialize: (state) => ({
        isSidebarCollapsed: state.isSidebarCollapsed,
        pageViews: state.pageViews,
        appointmentsView: state.appointmentsView,
      }),
    },
  ),
);
