"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { createCalendarEvent, cancelCalendarEvent } from "@/lib/google-calendar";
import { sendBookingConfirmationEmail } from "@/lib/email";
import type { BookingStatus, ActionResult, LessonType } from "@/types";

interface UpdateBookingData {
  status?: BookingStatus;
  scheduled_at?: string;
  instructor_id?: string | null;
  video_link?: string | null;
  notes?: string | null;
  cancellation_reason?: string | null;
  calendar_event_id?: string | null;
}

/**
 * Update a booking (admin only)
 */
export async function updateBooking(
  bookingId: string,
  data: UpdateBookingData
): Promise<ActionResult> {
  const supabase = await createClient();

  // Verify admin role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return {
      success: false,
      error: "Unauthorized - Admin access required",
    };
  }

  // Get current booking to check status change and get student info
  // Use admin client to bypass RLS and properly fetch the student profile
  const adminClient = createAdminClient();
  const { data: currentBooking } = await adminClient
    .from("bookings")
    .select("*, student:profiles!bookings_student_id_fkey(*)")
    .eq("id", bookingId)
    .single();

  if (!currentBooking) {
    return {
      success: false,
      error: "Booking not found",
    };
  }

  // Handle calendar event creation when confirming a pending booking
  if (data.status === "confirmed" && currentBooking.status === "pending") {
    try {
      console.log("Creating calendar event for booking:", bookingId);
      const calendarResult = await createCalendarEvent(
        new Date(currentBooking.scheduled_at),
        currentBooking.lesson_type as LessonType,
        currentBooking.student,
        bookingId
      );

      console.log("Calendar result:", calendarResult);

      if (calendarResult.success) {
        // Add calendar details to update data
        if (calendarResult.eventId) {
          // Store calendar event ID for future reference
          data.calendar_event_id = calendarResult.eventId;
        }
        if (calendarResult.meetLink) {
          data.video_link = calendarResult.meetLink;
          console.log("Meeting link created:", calendarResult.meetLink);
        } else {
          console.warn("Calendar event created but no meeting link returned");
        }
      } else {
        console.warn("Failed to create calendar event:", calendarResult.error);
        // Continue with confirmation even if calendar fails
      }
    } catch (error) {
      console.error("Error creating calendar event:", error);
      // Continue with confirmation
    }
  }

  // Handle calendar event cancellation
  if (data.status === "cancelled" && currentBooking.calendar_event_id) {
    try {
      await cancelCalendarEvent(currentBooking.calendar_event_id);
    } catch (error) {
      console.error("Error cancelling calendar event:", error);
      // Continue with cancellation even if calendar fails
    }
  }

  // Update booking
  const { error } = await supabase
    .from("bookings")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (error) {
    console.error("Error updating booking:", error);
    return {
      success: false,
      error: "Failed to update booking",
    };
  }

  // Send confirmation email to student when booking is confirmed
  if (data.status === "confirmed" && currentBooking.status === "pending") {
    try {
      const { data: updatedBooking } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (updatedBooking && currentBooking.student) {
        await sendBookingConfirmationEmail(updatedBooking, currentBooking.student);
      }
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Don't fail the update if email fails
    }
  }

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/bookings");
  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Cancel a booking (admin)
 */
export async function adminCancelBooking(
  bookingId: string,
  reason: string
): Promise<ActionResult> {
  return updateBooking(bookingId, {
    status: "cancelled",
    cancellation_reason: reason,
  });
}

/**
 * Complete a booking (admin)
 */
export async function adminCompleteBooking(
  bookingId: string,
  notes?: string
): Promise<ActionResult> {
  return updateBooking(bookingId, {
    status: "completed",
    notes: notes || undefined,
  });
}
