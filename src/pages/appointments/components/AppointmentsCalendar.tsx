/**
 * Appointments Calendar Component
 * Calendar view for appointments with month/week/day views
 */

import { memo, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { appointmentService, staffService } from "@/services";
import type { Appointment } from "@/types";
import { useAuth } from "@/contexts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarAppointmentCard } from "./CalendarAppointmentCard";
import { AppointmentFormDialog } from "./AppointmentFormDialog";
import {
  getMonthDays,
  getWeekDays,
  isToday,
  isCurrentMonth,
  navigateNext,
  navigatePrev,
  formatCalendarTitle,
  getMonthBounds,
  getWeekBounds,
  getDayBounds,
  getTimeSlots,
} from "@/utils/calendar.utils";
import { cn } from "@/lib/utils";

interface AppointmentsCalendarProps {
  storeId: string;
}

type CalendarView = "month" | "week" | "day";

export const AppointmentsCalendar = memo(function AppointmentsCalendar({
  storeId,
}: AppointmentsCalendarProps) {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("month");
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Fetch staff member record if user is staff
  const { data: staffMember } = useQuery({
    queryKey: ["my-staff-member", storeId, user?.id],
    queryFn: async () => {
      const staffMembers = await staffService.getStaffMembers(storeId);
      return staffMembers.find((s) => s.userId === user?.id);
    },
    enabled: !!storeId && user?.role === "staff",
  });

  // Get date range based on view
  const dateRange = useMemo(() => {
    switch (view) {
      case "month":
        return getMonthBounds(currentDate);
      case "week":
        return getWeekBounds(currentDate);
      case "day":
        return getDayBounds(currentDate);
    }
  }, [currentDate, view]);

  // Fetch appointments for the current view
  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: [
      "appointments",
      storeId,
      format(dateRange.start, "yyyy-MM-dd"),
      format(dateRange.end, "yyyy-MM-dd"),
      staffMember?.id,
    ],
    queryFn: () =>
      appointmentService.getAppointments(storeId, {
        startDate: format(dateRange.start, "yyyy-MM-dd"),
        endDate: format(dateRange.end, "yyyy-MM-dd"),
        limit: 500,
        staffId: user?.role === "staff" ? staffMember?.id : undefined,
      }),
    enabled: !!storeId && (user?.role !== "staff" || !!staffMember),
  });

  const appointments = appointmentsData?.data ?? [];

  // Get days to display based on view
  const displayDays = useMemo(() => {
    switch (view) {
      case "month":
        return getMonthDays(currentDate);
      case "week":
        return getWeekDays(currentDate);
      case "day":
        return [currentDate];
    }
  }, [currentDate, view]);

  // Group appointments by day
  const appointmentsByDay = useMemo(() => {
    const grouped = new Map<string, Appointment[]>();

    appointments.forEach((appointment) => {
      const dateKey = format(parseISO(appointment.startDateTime), "yyyy-MM-dd");
      const existing = grouped.get(dateKey) || [];
      grouped.set(dateKey, [...existing, appointment]);
    });

    // Sort appointments by time within each day
    grouped.forEach((apps, key) => {
      grouped.set(
        key,
        apps.sort((a, b) => a.startDateTime.localeCompare(b.startDateTime)),
      );
    });

    return grouped;
  }, [appointments]);

  // Navigation handlers
  const handlePrev = () => setCurrentDate(navigatePrev(currentDate, view));
  const handleNext = () => setCurrentDate(navigateNext(currentDate, view));
  const handleToday = () => setCurrentDate(new Date());

  // Appointment handlers
  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setSelectedAppointment(null);
    setIsFormOpen(false);
  };

  // Render month view
  const renderMonthView = () => {
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return (
      <div className="grid grid-cols-4 xl:grid-cols-7 gap-1">
        {/* Week day headers */}
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-600 py-2"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {displayDays.map((day, index) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayAppointments = appointmentsByDay.get(dateKey) || [];
          const isCurrentDay = isToday(day);
          const isInCurrentMonth = isCurrentMonth(day, currentDate);

          return (
            <div
              key={index}
              className={cn(
                "min-h-[120px] border rounded-lg p-2",
                isCurrentDay && "bg-blue-50 border-blue-300",
                !isInCurrentMonth && "bg-gray-50 opacity-50",
              )}
            >
              <div
                className={cn(
                  "text-sm font-medium mb-1",
                  isCurrentDay && "text-blue-600",
                )}
              >
                {format(day, "d")}
              </div>
              <div className="space-y-1 overflow-y-auto max-h-[90px]">
                {dayAppointments.map((appointment) => (
                  <CalendarAppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onClick={() => handleAppointmentClick(appointment)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const timeSlots = getTimeSlots();

    return (
      <div className="flex gap-2 overflow-x-auto">
        {/* Time column */}
        <div className="shrink-0 w-16">
          <div className="h-12 border-b"></div>
          {timeSlots.map((time) => (
            <div key={time} className="h-16 text-xs text-gray-500 pr-2">
              {time}
            </div>
          ))}
        </div>

        {/* Days columns */}
        {displayDays.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayAppointments = appointmentsByDay.get(dateKey) || [];
          const isCurrentDay = isToday(day);

          return (
            <div key={dateKey} className="flex-1 min-w-[150px]">
              <div
                className={cn(
                  "h-12 border-b text-center py-2",
                  isCurrentDay && "bg-blue-50",
                )}
              >
                <div className="font-medium">{format(day, "EEE")}</div>
                <div
                  className={cn(
                    "text-sm",
                    isCurrentDay ? "text-blue-600 font-bold" : "text-gray-600",
                  )}
                >
                  {format(day, "d")}
                </div>
              </div>
              <div className="relative">
                {timeSlots.map((time) => (
                  <div
                    key={time}
                    className="h-16 border-b border-gray-100"
                  ></div>
                ))}
                <div className="absolute top-0 left-0 right-0 space-y-1 p-1">
                  {dayAppointments.map((appointment) => (
                    <CalendarAppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onClick={() => handleAppointmentClick(appointment)}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render day view
  const renderDayView = () => {
    const timeSlots = getTimeSlots();
    const dateKey = format(currentDate, "yyyy-MM-dd");
    const dayAppointments = appointmentsByDay.get(dateKey) || [];

    return (
      <div className="flex gap-4">
        {/* Time column */}
        <div className="w-20 shrink-0">
          {timeSlots.map((time) => (
            <div
              key={time}
              className="h-20 text-sm text-gray-600 flex items-start pt-1"
            >
              {time}
            </div>
          ))}
        </div>

        {/* Appointments column */}
        <div className="flex-1 relative border-l">
          {timeSlots.map((time) => (
            <div key={time} className="h-20 border-b border-gray-200"></div>
          ))}
          <div className="absolute top-0 left-0 right-0 p-2 space-y-2">
            {dayAppointments.map((appointment) => (
              <Card
                key={appointment.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleAppointmentClick(appointment)}
              >
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium">
                      {appointment.customerName || "Customer"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(parseISO(appointment.startDateTime), "HH:mm")} -{" "}
                      {format(parseISO(appointment.endDateTime), "HH:mm")}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Service ID: {appointment.serviceId}
                  </div>
                  <div className="text-sm font-medium text-blue-600">
                    ${appointment.totalPrice}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Title */}
            <h2 className="text-xl font-semibold">
              {formatCalendarTitle(currentDate, view)}
            </h2>

            {/* View selector */}
            <Select
              value={view}
              onValueChange={(value) => setView(value as CalendarView)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="day">Day</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-[500px]">
              <div className="text-gray-500">Loading appointments...</div>
            </div>
          ) : (
            <>
              {view === "month" && renderMonthView()}
              {view === "week" && renderWeekView()}
              {view === "day" && renderDayView()}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Appointment Dialog */}
      {selectedAppointment && (
        <AppointmentFormDialog
          storeId={storeId}
          appointment={selectedAppointment}
          open={isFormOpen}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
});

AppointmentsCalendar.displayName = "AppointmentsCalendar";
