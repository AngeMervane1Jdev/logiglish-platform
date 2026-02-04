"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cancelCalendarEvent } from "@/lib/google-calendar";
import { sendBookingCancellationEmail } from "@/lib/email";
import type { ActionResult } from "@/types";

/**
 * Cancel a booking (student)
 */
export async function cancelBooking(
  bookingId: string,
  reason: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be logged in to cancel a booking",
    };
  }

  // Verify the booking belongs to this user
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("student_id", user.id)
    .single();

  if (fetchError || !booking) {
    return {
      success: false,
      error: "Booking not found",
    };
  }

  // Check if booking can be cancelled
  if (booking.status === "cancelled") {
    return {
      success: false,
      error: "This booking is already cancelled",
    };
  }

  if (booking.status === "completed") {
    return {
      success: false,
      error: "Cannot cancel a completed booking",
    };
  }

  // Cancel the Google Calendar event if it exists
  if (booking.calendar_event_id) {
    try {
      await cancelCalendarEvent(booking.calendar_event_id);
    } catch (error) {
      console.error("Failed to cancel Google Calendar event:", error);
      // Continue with cancellation even if calendar deletion fails
    }
  }

  // Update booking status
  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancellation_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (updateError) {
    console.error("Error cancelling booking:", updateError);
    return {
      success: false,
      error: "Failed to cancel booking",
    };
  }

  // Send cancellation email
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profile) {
      await sendBookingCancellationEmail(booking, profile, reason);
    }
  } catch (emailError) {
    console.error("Failed to send cancellation email:", emailError);
  }

  revalidatePath("/bookings");
  revalidatePath("/dashboard");
  revalidatePath("/admin/bookings");

  return {
    success: true,
  };
}
