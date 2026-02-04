import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingReminderEmail } from "@/lib/email";
import type { Booking, Profile } from "@/types";

export const dynamic = "force-dynamic";

/**
 * Cron job endpoint that sends 24-hour reminder emails for confirmed bookings.
 * Runs every hour via Vercel Cron.
 *
 * Security: Requires Authorization header with CRON_SECRET.
 * Vercel sends this automatically for cron jobs.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // Find confirmed bookings scheduled between 23 and 25 hours from now
    // that haven't received a reminder yet
    const now = new Date();
    const from = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const to = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const { data: bookings, error: queryError } = await supabase
      .from("bookings")
      .select("*")
      .eq("status", "confirmed")
      .eq("reminder_sent", false)
      .gte("scheduled_at", from.toISOString())
      .lte("scheduled_at", to.toISOString());

    if (queryError) {
      console.error("Error querying bookings:", queryError);
      return NextResponse.json(
        { error: "Failed to query bookings" },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ message: "No reminders to send", sent: 0 });
    }

    // Get unique student IDs
    const studentIds = Array.from(new Set(bookings.map((b) => b.student_id)));

    const { data: students, error: studentsError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", studentIds);

    if (studentsError) {
      console.error("Error querying students:", studentsError);
      return NextResponse.json(
        { error: "Failed to query student profiles" },
        { status: 500 }
      );
    }

    const studentMap = new Map(
      (students as Profile[]).map((s) => [s.id, s])
    );

    const results: { bookingId: string; success: boolean; error?: string }[] = [];

    for (const booking of bookings as Booking[]) {
      const student = studentMap.get(booking.student_id);

      if (!student) {
        results.push({
          bookingId: booking.id,
          success: false,
          error: "Student profile not found",
        });
        continue;
      }

      const emailResult = await sendBookingReminderEmail(booking, student);

      if (emailResult.success) {
        // Mark reminder as sent
        await supabase
          .from("bookings")
          .update({ reminder_sent: true })
          .eq("id", booking.id);
      }

      results.push({
        bookingId: booking.id,
        success: emailResult.success,
        error: emailResult.error,
      });
    }

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `Processed ${results.length} reminders`,
      sent,
      failed,
      results,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
