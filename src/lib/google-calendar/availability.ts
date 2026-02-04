import { getGoogleCalendarClient, getInstructorCalendarId } from "./client";
import { addDays, startOfDay, endOfDay, format, addMinutes, isBefore, isAfter } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { BOOKING_DEADLINE_HOURS, LESSON_TYPE_DURATIONS } from "@/lib/utils/constants";
import type { LessonType } from "@/types";

export interface TimeSlot {
  start: Date;
  end: Date;
  formatted: string;
}

export interface AvailabilityConfig {
  // Working hours in instructor's timezone (e.g., "Asia/Tokyo")
  timezone: string;
  workingHours: {
    start: number; // Hour (0-23), e.g., 9 for 9 AM
    end: number; // Hour (0-23), e.g., 18 for 6 PM
  };
  // Days of week available (0 = Sunday, 1 = Monday, etc.)
  workingDays: number[];
  // Slot duration in minutes
  slotDuration: number;
  // Buffer between slots in minutes
  bufferMinutes: number;
}

// Default availability configuration - can be customized per instructor
const DEFAULT_AVAILABILITY: AvailabilityConfig = {
  timezone: process.env.INSTRUCTOR_TIMEZONE || "Asia/Tokyo",
  workingHours: {
    start: 9, // 9 AM
    end: 21, // 9 PM
  },
  workingDays: [1, 2, 3, 4, 5, 6], // Monday to Saturday
  slotDuration: 30,
  bufferMinutes: 15,
};

/**
 * Get busy times from Google Calendar for a date range
 */
async function getBusyTimes(
  startDate: Date,
  endDate: Date
): Promise<{ start: Date; end: Date }[]> {
  const calendar = getGoogleCalendarClient();
  const calendarId = getInstructorCalendarId();

  try {
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        items: [{ id: calendarId }],
      },
    });

    const busy = response.data.calendars?.[calendarId]?.busy || [];

    return busy.map((period) => ({
      start: new Date(period.start!),
      end: new Date(period.end!),
    }));
  } catch (error) {
    console.error("Error fetching busy times:", error);
    throw new Error("Failed to fetch calendar availability");
  }
}

/**
 * Check if a time slot overlaps with any busy period
 */
function isSlotBusy(
  slotStart: Date,
  slotEnd: Date,
  busyTimes: { start: Date; end: Date }[]
): boolean {
  return busyTimes.some(
    (busy) => slotStart < busy.end && slotEnd > busy.start
  );
}

/**
 * Generate all possible time slots for a given day
 */
function generateDaySlots(
  date: Date,
  config: AvailabilityConfig,
  lessonDuration: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const dayOfWeek = date.getDay();

  // Check if this day is a working day
  if (!config.workingDays.includes(dayOfWeek)) {
    return slots;
  }

  // Create slots in instructor's timezone
  const zonedDate = toZonedTime(date, config.timezone);
  const dayStart = startOfDay(zonedDate);

  // Start from working hours start
  let currentTime = addMinutes(dayStart, config.workingHours.start * 60);
  const dayEnd = addMinutes(dayStart, config.workingHours.end * 60);

  // Total slot duration including buffer
  const totalSlotDuration = lessonDuration + config.bufferMinutes;

  while (isBefore(addMinutes(currentTime, lessonDuration), dayEnd) ||
         addMinutes(currentTime, lessonDuration).getTime() === dayEnd.getTime()) {
    const slotStart = fromZonedTime(currentTime, config.timezone);
    const slotEnd = fromZonedTime(addMinutes(currentTime, lessonDuration), config.timezone);

    slots.push({
      start: slotStart,
      end: slotEnd,
      formatted: format(currentTime, "h:mm a"),
    });

    currentTime = addMinutes(currentTime, totalSlotDuration);
  }

  return slots;
}

/**
 * Get available time slots for booking
 */
export async function getAvailableSlots(
  lessonType: LessonType,
  daysAhead: number = 14,
  config: AvailabilityConfig = DEFAULT_AVAILABILITY
): Promise<{ date: string; slots: TimeSlot[] }[]> {
  const now = new Date();
  const lessonDuration = LESSON_TYPE_DURATIONS[lessonType];

  // Start from tomorrow or after the booking deadline
  const deadlineDate = addMinutes(now, BOOKING_DEADLINE_HOURS * 60);
  const startDate = isAfter(deadlineDate, addDays(now, 1))
    ? startOfDay(deadlineDate)
    : startOfDay(addDays(now, 1));

  const endDate = endOfDay(addDays(now, daysAhead));

  // Get busy times from Google Calendar
  const busyTimes = await getBusyTimes(startDate, endDate);

  // Also get existing bookings from our database to avoid double-booking
  // This is handled separately in the booking action

  const availability: { date: string; slots: TimeSlot[] }[] = [];

  // Generate slots for each day
  let currentDate = startDate;
  while (isBefore(currentDate, endDate)) {
    const daySlots = generateDaySlots(currentDate, config, lessonDuration);

    // Filter out busy slots and slots before the deadline
    const availableSlots = daySlots.filter((slot) => {
      // Check if slot is after booking deadline
      if (isBefore(slot.start, deadlineDate)) {
        return false;
      }

      // Check if slot conflicts with Google Calendar
      if (isSlotBusy(slot.start, slot.end, busyTimes)) {
        return false;
      }

      return true;
    });

    if (availableSlots.length > 0) {
      availability.push({
        date: format(currentDate, "yyyy-MM-dd"),
        slots: availableSlots,
      });
    }

    currentDate = addDays(currentDate, 1);
  }

  return availability;
}

/**
 * Check if a specific time slot is available
 */
export async function isSlotAvailable(
  startTime: Date,
  lessonType: LessonType
): Promise<boolean> {
  const now = new Date();
  const deadlineDate = addMinutes(now, BOOKING_DEADLINE_HOURS * 60);
  const lessonDuration = LESSON_TYPE_DURATIONS[lessonType];
  const endTime = addMinutes(startTime, lessonDuration);

  // Check booking deadline
  if (isBefore(startTime, deadlineDate)) {
    return false;
  }

  // Check Google Calendar availability
  const busyTimes = await getBusyTimes(
    addMinutes(startTime, -60), // Check an hour before
    addMinutes(endTime, 60) // Check an hour after
  );

  return !isSlotBusy(startTime, endTime, busyTimes);
}

/**
 * Get instructor's timezone
 */
export function getInstructorTimezone(): string {
  return DEFAULT_AVAILABILITY.timezone;
}
