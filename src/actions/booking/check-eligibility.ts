"use server";

import { createClient } from "@/lib/supabase/server";
import type { BookingEligibility, Booking, Profile, LessonType } from "@/types";

/**
 * Check if a user is eligible to create a new booking
 */
export async function checkBookingEligibility(
  lessonType?: LessonType
): Promise<BookingEligibility> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      canBook: false,
      reason: "You must be logged in to book a lesson",
    };
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      canBook: false,
      reason: "Could not find your profile. Please contact support.",
    };
  }

  const typedProfile = profile as Profile;

  // Check subscription plan for micro response practice
  if (
    lessonType === "micro_response_practice" &&
    typedProfile.subscription_plan !== "premium"
  ) {
    return {
      canBook: false,
      reason:
        "Micro Response Practice is only available for Premium plan subscribers. Please upgrade your plan to access this feature.",
    };
  }

  // Check for existing active booking
  const { data: activeBooking, error: bookingError } = await supabase
    .from("bookings")
    .select("*")
    .eq("student_id", user.id)
    .in("status", ["pending", "confirmed"])
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .single();

  if (activeBooking && !bookingError) {
    return {
      canBook: false,
      reason:
        "You already have an active booking. Please complete or cancel your current booking before scheduling a new one.",
      activeBooking: activeBooking as Booking,
    };
  }

  return {
    canBook: true,
  };
}
