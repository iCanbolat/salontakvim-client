/**
 * Widget Preview Component
 * Shows a live mockup preview of the booking widget with current settings
 * Mimics the actual widget structure from the widget project
 */

import { useMemo, useEffect } from "react";
import { Check, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import type { WidgetSettings } from "@/types/widget.types";

interface WidgetPreviewProps {
  settings: WidgetSettings;
}

// Google Fonts URL mapping
const GOOGLE_FONTS: Record<string, string> = {
  Inter: "Inter:wght@400;500;600;700",
  Roboto: "Roboto:wght@400;500;700",
  "Open Sans": "Open+Sans:wght@400;500;600;700",
  Lato: "Lato:wght@400;700",
  Poppins: "Poppins:wght@400;500;600;700",
  Montserrat: "Montserrat:wght@400;500;600;700",
  Nunito: "Nunito:wght@400;500;600;700",
  Raleway: "Raleway:wght@400;500;600;700",
};

type BookingStep =
  | "service"
  | "employee"
  | "location"
  | "extras"
  | "dateTime"
  | "customerInfo"
  | "payment"
  | "confirmation";

const STEP_LABELS: Record<BookingStep, string> = {
  service: "Choose Service",
  employee: "Select Staff",
  location: "Choose Location",
  extras: "Add Extras",
  dateTime: "Pick Date & Time",
  customerInfo: "Your Information",
  payment: "Payment",
  confirmation: "Confirm Booking",
};

const STEP_ORDER: BookingStep[] = [
  "service",
  "employee",
  "location",
  "extras",
  "dateTime",
  "customerInfo",
  "payment",
  "confirmation",
];

export function WidgetPreview({ settings }: WidgetPreviewProps) {
  const {
    primaryColor,
    sidebarBackgroundColor,
    contentBackgroundColor,
    textColor,
    headingColor,
    fontFamily,
    buttonBorderRadius,
    sidebarMenuItems,
  } = settings;

  // Load Google Font dynamically when fontFamily changes
  useEffect(() => {
    const fontParam = GOOGLE_FONTS[fontFamily];
    if (!fontParam) return;

    const linkId = `google-font-${fontFamily.replace(/\s+/g, "-")}`;

    // Check if font is already loaded
    if (document.getElementById(linkId)) return;

    const link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${fontParam}&display=swap`;
    document.head.appendChild(link);
  }, [fontFamily]);

  // Filter visible steps based on sidebarMenuItems config
  const visibleSteps = useMemo(() => {
    return STEP_ORDER.filter((step) => {
      if (step === "confirmation") return true;
      const key = step as keyof typeof sidebarMenuItems;
      return sidebarMenuItems[key] !== false;
    });
  }, [sidebarMenuItems]);

  // Mock current step (always first)
  const currentStep: BookingStep = "service";
  const currentStepIndex = visibleSteps.indexOf(currentStep);

  // Calculate contrast color for text readability
  const getContrastColor = (hexColor: string) => {
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#000000" : "#ffffff";
  };

  const buttonTextColor = getContrastColor(primaryColor);

  // Mock services data
  const mockServices = [
    { id: 1, name: "Haircut", duration: 30, price: "150" },
    { id: 2, name: "Hair Coloring", duration: 60, price: "350" },
    { id: 3, name: "Beard Trim", duration: 15, price: "75" },
  ];

  return (
    <div
      className="rounded-xl border shadow-lg overflow-hidden"
      style={{
        fontFamily: `${fontFamily}, sans-serif`,
      }}
    >
      {/* Widget Container - Desktop layout with sidebar */}
      <div className="flex h-[500px]">
        {/* Sidebar */}
        <aside
          className="w-64 shrink-0 border-r overflow-y-auto p-6"
          style={{ backgroundColor: sidebarBackgroundColor }}
        >
          {/* Header */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-between">
              <h2
                className="text-lg font-semibold"
                style={{ color: headingColor }}
              >
                Booking Steps
              </h2>
            </div>
            <p className="text-sm" style={{ color: `${textColor}99` }}>
              Complete each step to book your appointment
            </p>
          </div>

          {/* Progress Bar - Shows on mobile/tablet, hidden on desktop */}
          <div className="mb-6 md:hidden">
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <div
                className="h-full transition-all duration-300"
                style={{
                  backgroundColor: primaryColor,
                  width: `${
                    ((currentStepIndex + 1) / visibleSteps.length) * 100
                  }%`,
                }}
              />
            </div>
            <p className="text-xs mt-1.5" style={{ color: `${textColor}80` }}>
              Step {currentStepIndex + 1} of {visibleSteps.length}
            </p>
          </div>

          {/* Step List */}
          <nav className="space-y-2">
            {visibleSteps.map((step, index) => {
              const isCurrent = step === currentStep;
              const isCompleted = index < currentStepIndex;
              const isUpcoming = index > currentStepIndex;

              return (
                <div
                  key={step}
                  className="flex items-center gap-3 rounded-lg p-3 transition-colors"
                  style={{
                    backgroundColor: isCurrent
                      ? `${primaryColor}15`
                      : "transparent",
                    borderWidth: isCurrent ? "1px" : "0",
                    borderStyle: "solid",
                    borderColor: isCurrent
                      ? `${primaryColor}30`
                      : "transparent",
                  }}
                >
                  {/* Step indicator */}
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-medium text-sm"
                    style={{
                      backgroundColor:
                        isCurrent || isCompleted
                          ? primaryColor
                          : `${textColor}15`,
                      color:
                        isCurrent || isCompleted
                          ? buttonTextColor
                          : `${textColor}60`,
                    }}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  {/* Step label */}
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: isCurrent
                        ? headingColor
                        : isUpcoming
                        ? `${textColor}50`
                        : `${textColor}80`,
                    }}
                  >
                    {STEP_LABELS[step]}
                  </span>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main
          className="flex-1 min-w-0 flex flex-col relative"
          style={{ backgroundColor: contentBackgroundColor }}
        >
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 mb-16">
            {/* Page Header */}
            <div className="mb-6">
              <h2
                className="text-xl font-semibold mb-1"
                style={{ color: headingColor }}
              >
                Select Service
              </h2>
              <p className="text-sm" style={{ color: `${textColor}70` }}>
                Choose the service you'd like to book
              </p>
            </div>

            {/* Service List */}
            <div className="space-y-2">
              {mockServices.map((service, index) => {
                const isSelected = index === 0;

                return (
                  <button
                    key={service.id}
                    className="w-full text-left p-3 rounded-lg border transition-all"
                    style={{
                      borderColor: isSelected ? primaryColor : `${textColor}20`,
                      backgroundColor: isSelected
                        ? `${primaryColor}08`
                        : "transparent",
                    }}
                  >
                    <div className="space-y-2">
                      {/* Service Name & Price */}
                      <div className="flex items-start justify-between gap-3">
                        <h3
                          className="font-medium text-sm leading-tight flex-1"
                          style={{ color: headingColor }}
                        >
                          {service.name}
                        </h3>
                        <div
                          className="font-semibold text-sm whitespace-nowrap"
                          style={{ color: primaryColor }}
                        >
                          ₺{service.price}
                        </div>
                      </div>

                      {/* Description */}
                      <p
                        className="text-xs line-clamp-2"
                        style={{ color: `${textColor}70` }}
                      >
                        Professional {service.name.toLowerCase()} service
                      </p>

                      {/* Duration */}
                      <div
                        className="flex items-center gap-1.5 text-xs"
                        style={{ color: `${textColor}60` }}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        <span>{service.duration} min</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Buttons - Fixed at bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 border-t p-4"
            style={{ backgroundColor: `${contentBackgroundColor}F5` }}
          >
            <div className="flex items-center justify-between gap-3">
              <button
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors invisible"
                style={{ color: textColor }}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              <button
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium min-w-[100px] justify-center transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: primaryColor,
                  color: buttonTextColor,
                  borderRadius: `${buttonBorderRadius}px`,
                }}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default WidgetPreview;
