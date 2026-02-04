"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isSlotAvailable } from "@/lib/google-calendar";
import { sendBookingConfirmationEmail, sendAdminBookingNotification } from "@/lib/email";
import { BOOKING_DEADLINE_HOURS } from "@/lib/utils/constants";
import { addMinutes, isBefore } from "date-fns";
import type { ActionResult, LessonType } from "@/types";

const createBookingSchema = z.object({
  lessonType: z.enum(["response_practice", "micro_response_practice"]),
  scheduledAt: z.string().datetime(),
});

export async function createBooking(
  data: z.infer<typeof createBookingSchema>
): Promise<ActionResult<{ bookingId: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be logged in to create a booking",
    };
  }

  // Validate input
  const parsed = createBookingSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
    };
  }

  const { lessonType, scheduledAt } = parsed.data;
  const scheduledDate = new Date(scheduledAt);

  // Check booking deadline (36 hours in advance)
  const now = new Date();
  const deadlineDate = addMinutes(now, BOOKING_DEADLINE_HOURS * 60);
  if (isBefore(scheduledDate, deadlineDate)) {
    return {
      success: false,
      error: `Bookings must be made at least ${BOOKING_DEADLINE_HOURS} hours in advance`,
    };
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return {
      success: false,
      error: "Profile not found",
    };
  }

  // Check if user can book this lesson type (micro practice requires premium)
  if (lessonType === "micro_response_practice" && profile.subscription_plan !== "premium") {
    return {
      success: false,
      error: "Micro Response Practice is only available for premium users",
    };
  }

  // Check if user already has an active booking
  const { data: existingBooking } = await supabase
    .from("bookings")
    .select("id")
    .eq("student_id", user.id)
    .in("status", ["pending", "confirmed"])
    .single();

  if (existingBooking) {
    return {
      success: false,
      error: "You already have an active booking. Please cancel it first to book a new session.",
    };
  }

  // Check if the slot is still available
  const slotAvailable = await isSlotAvailable(scheduledDate, lessonType as LessonType);
  if (!slotAvailable) {
    return {
      success: false,
      error: "This time slot is no longer available. Please select a different time.",
    };
  }

  // Create the booking with pending status
  // Calendar event will be created when admin confirms the booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      student_id: user.id,
      lesson_type: lessonType,
      status: "pending",
      scheduled_at: scheduledDate.toISOString(),
    })
    .select()
    .single();

  if (bookingError || !booking) {
    console.error("Error creating booking:", bookingError);
    return {
      success: false,
      error: "Failed to create booking",
    };
  }

  // Send notification to admin about new pending booking (don't fail if email fails)
  try {
    await sendAdminBookingNotification(booking, profile);
  } catch (emailError) {
    console.error("Error sending admin notification:", emailError);
  }

  revalidatePath("/bookings");
  revalidatePath("/dashboard");
  revalidatePath("/admin/bookings");

  return {
    success: true,
    data: { bookingId: booking.id },
  };
}
