import { format, formatDistanceToNow, isAfter, isBefore, addHours } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { BOOKING_DEADLINE_HOURS } from "./constants";

/**
 * Format a date for display
 */
export function formatDate(date: Date | string, formatStr: string = "PPP"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, formatStr);
}

/**
 * Format a date with time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "PPP 'at' p");
}

/**
 * Format time only
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "p");
}

/**
 * Get relative time string (e.g., "in 2 hours", "3 days ago")
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Format date in a specific timezone
 */
export function formatInTimezone(
  date: Date | string,
  timezone: string,
  formatStr: string = "PPP 'at' p zzz"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(d, timezone, formatStr);
}

/**
 * Convert date to a specific timezone
 */
export function toTimezone(date: Date | string, timezone: string): Date {
  const d = typeof date === "string" ? new Date(date) : date;
  return toZonedTime(d, timezone);
}

/**
 * Check if a booking time meets the 36-hour deadline
 */
export function isWithinBookingDeadline(scheduledAt: Date | string): boolean {
  const scheduled = typeof scheduledAt === "string" ? new Date(scheduledAt) : scheduledAt;
  const deadline = addHours(new Date(), BOOKING_DEADLINE_HOURS);
  return isAfter(scheduled, deadline);
}

/**
 * Get the minimum booking time (36 hours from now)
 */
export function getMinimumBookingTime(): Date {
  return addHours(new Date(), BOOKING_DEADLINE_HOURS);
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return isBefore(d, new Date());
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return isAfter(d, new Date());
}

/**
 * Format duration in minutes to human readable
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${remainingMinutes} min`;
}
