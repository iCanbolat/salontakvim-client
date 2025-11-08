/**
 * Calendar Utility Functions
 * Helper functions for calendar date calculations and formatting
 */

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  format,
  startOfDay,
  endOfDay,
} from "date-fns";

/**
 * Get all days in a month view (including padding days from prev/next month)
 */
export function getMonthDays(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
}

/**
 * Get days in a week view
 */
export function getWeekDays(date: Date): Date[] {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

  return eachDayOfInterval({ start: weekStart, end: weekEnd });
}

/**
 * Check if a day is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Check if a day is in the current month
 */
export function isCurrentMonth(date: Date, currentMonth: Date): boolean {
  return isSameMonth(date, currentMonth);
}

/**
 * Navigate to next period
 */
export function navigateNext(
  currentDate: Date,
  view: "month" | "week" | "day"
): Date {
  switch (view) {
    case "month":
      return addMonths(currentDate, 1);
    case "week":
      return addWeeks(currentDate, 1);
    case "day":
      return addDays(currentDate, 1);
    default:
      return currentDate;
  }
}

/**
 * Navigate to previous period
 */
export function navigatePrev(
  currentDate: Date,
  view: "month" | "week" | "day"
): Date {
  switch (view) {
    case "month":
      return subMonths(currentDate, 1);
    case "week":
      return subWeeks(currentDate, 1);
    case "day":
      return subDays(currentDate, 1);
    default:
      return currentDate;
  }
}

/**
 * Format calendar header title
 */
export function formatCalendarTitle(
  date: Date,
  view: "month" | "week" | "day"
): string {
  switch (view) {
    case "month":
      return format(date, "MMMM yyyy");
    case "week":
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
      return `${format(weekStart, "MMM d")} - ${format(
        weekEnd,
        "MMM d, yyyy"
      )}`;
    case "day":
      return format(date, "EEEE, MMMM d, yyyy");
    default:
      return "";
  }
}

/**
 * Get day bounds for filtering appointments
 */
export function getDayBounds(date: Date): { start: Date; end: Date } {
  return {
    start: startOfDay(date),
    end: endOfDay(date),
  };
}

/**
 * Get week bounds for filtering appointments
 */
export function getWeekBounds(date: Date): { start: Date; end: Date } {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

/**
 * Get month bounds for filtering appointments
 */
export function getMonthBounds(date: Date): { start: Date; end: Date } {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

/**
 * Get time slots for day view (24-hour format)
 */
export function getTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
  }
  return slots;
}
