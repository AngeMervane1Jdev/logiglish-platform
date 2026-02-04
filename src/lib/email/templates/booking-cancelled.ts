import { LESSON_TYPE_LABELS } from "@/lib/utils/constants";
import type { Booking, Profile } from "@/types";

interface BookingCancelledEmailProps {
  booking: Booking;
  student: Profile;
  appUrl: string;
  reason?: string;
}

export function generateBookingCancelledHTML({
  booking,
  student,
  appUrl,
  reason,
}: BookingCancelledEmailProps): string {
  const scheduledDate = new Date(booking.scheduled_at);
  const formattedDate = scheduledDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = scheduledDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const reasonSection = reason
    ? `
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="color: #991b1b; font-size: 14px; font-weight: bold; margin: 0 0 8px;">Cancellation Reason</p>
      <p style="color: #7f1d1d; font-size: 14px; margin: 0;">${reason}</p>
    </div>
  `
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; margin: 0; padding: 20px;">
  <div style="background-color: #ffffff; margin: 0 auto; padding: 40px 20px; max-width: 600px; border-radius: 8px;">
    <h1 style="color: #1f2937; font-size: 24px; font-weight: bold; margin: 0 0 20px; padding: 0;">Booking Cancelled</h1>

    <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 16px 0;">Hi ${student.full_name || "there"},</p>

    <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 16px 0;">
      Your <strong>${LESSON_TYPE_LABELS[booking.lesson_type]}</strong> session scheduled for ${formattedDate} at ${formattedTime} has been cancelled.
    </p>

    ${reasonSection}

    <hr style="border-color: #e5e7eb; margin: 24px 0;">

    <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 16px 0;"><strong>Ready to reschedule?</strong></p>
    <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 16px 0;">
      You can book a new session at any time from your dashboard:
    </p>
    <p style="margin: 16px 0;">
      <a href="${appUrl}/book" style="background-color: #18181b; border-radius: 6px; color: #ffffff; display: inline-block; font-size: 14px; font-weight: bold; padding: 12px 24px; text-decoration: none;">Book New Lesson</a>
    </p>

    <hr style="border-color: #e5e7eb; margin: 24px 0;">

    <p style="color: #9ca3af; font-size: 12px; line-height: 16px; margin: 24px 0 0;">
      This email was sent by Logiglish. If you have any questions, please contact us at support@logiglish.com.
    </p>
  </div>
</body>
</html>
`;
}
