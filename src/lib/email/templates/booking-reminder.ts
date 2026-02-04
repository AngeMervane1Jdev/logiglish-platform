import { LESSON_TYPE_LABELS, LESSON_TYPE_DURATIONS } from "@/lib/utils/constants";
import type { Booking, Profile } from "@/types";

interface BookingReminderEmailProps {
  booking: Booking;
  student: Profile;
  appUrl: string;
}

export function generateBookingReminderHTML({
  booking,
  student,
  appUrl,
}: BookingReminderEmailProps): string {
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

  const videoLinkSection = booking.video_link
    ? `
    <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="color: #1f2937; font-size: 18px; font-weight: bold; margin: 0 0 12px;">Ready to Join?</p>
      <a href="${booking.video_link}" style="background-color: #18181b; border-radius: 6px; color: #ffffff; display: inline-block; font-size: 14px; font-weight: bold; padding: 12px 24px; text-decoration: none; margin: 12px 0;">Join Video Call</a>
      <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0;">Note: The video call link will be active 10 minutes before your scheduled time.</p>
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
    <h1 style="color: #1f2937; font-size: 24px; font-weight: bold; margin: 0 0 20px; padding: 0;">Lesson Reminder</h1>

    <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 16px 0;">Hi ${student.full_name || "there"},</p>

    <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 16px 0;">
      This is a friendly reminder that your <strong>${LESSON_TYPE_LABELS[booking.lesson_type]}</strong> session is coming up tomorrow!
    </p>

    <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="color: #1f2937; font-size: 18px; font-weight: bold; margin: 0 0 12px;">Session Details</p>
      <p style="color: #374151; font-size: 14px; line-height: 20px; margin: 4px 0;"><strong>Date:</strong> ${formattedDate}</p>
      <p style="color: #374151; font-size: 14px; line-height: 20px; margin: 4px 0;"><strong>Time:</strong> ${formattedTime}</p>
      <p style="color: #374151; font-size: 14px; line-height: 20px; margin: 4px 0;"><strong>Duration:</strong> ${LESSON_TYPE_DURATIONS[booking.lesson_type]} minutes</p>
    </div>

    ${videoLinkSection}

    <hr style="border-color: #e5e7eb; margin: 24px 0;">

    <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 16px 0;"><strong>Preparation Checklist:</strong></p>
    <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 16px 0;">
      - Review your pre-study materials<br>
      - Test your camera and microphone<br>
      - Find a quiet space with good internet<br>
      - Have a pen and paper ready for notes
    </p>

    <hr style="border-color: #e5e7eb; margin: 24px 0;">

    <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 16px 0;">
      Need to cancel or reschedule? Please do so at least 24 hours in advance:
    </p>
    <p style="margin: 16px 0;">
      <a href="${appUrl}/bookings/${booking.id}" style="color: #2563eb; text-decoration: underline;">Manage Booking</a>
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
