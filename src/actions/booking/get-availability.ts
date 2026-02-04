"use server";

import { createClient } from "@/lib/supabase/server";
import { getAvailableSlots, getInstructorTimezone, type TimeSlot } from "@/lib/google-calendar";
import type { ActionResult, LessonType } from "@/types";

interface AvailabilityData {
  availability: { date: string; slots: TimeSlot[] }[];
  timezone: string;
}

export async function getBookingAvailability(
  lessonType: LessonType
): Promise<ActionResult<AvailabilityData>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be logged in to view availability",
    };
  }

  try {
    // Get available slots from Google Calendar
    const availability = await getAvailableSlots(lessonType, 14);

    // Get existing pending/confirmed bookings to filter out
    const { data: existingBookings } = await supabase
      .from("bookings")
      .select("scheduled_at")
      .in("status", ["pending", "confirmed"]);

    // Filter out slots that are already booked in our database
    const bookedTimes = new Set(
      existingBookings?.map((b) => new Date(b.scheduled_at).getTime()) || []
    );

    const filteredAvailability = availability.map((day) => ({
      ...day,
      slots: day.slots.filter((slot) => !bookedTimes.has(slot.start.getTime())),
    })).filter((day) => day.slots.length > 0);

    return {
      success: true,
      data: {
        availability: filteredAvailability,
        timezone: getInstructorTimezone(),
      },
    };
  } catch (error) {
    console.error("Error fetching availability:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch availability",
    };
  }
}
