import { LESSON_TYPE_LABELS, LESSON_TYPE_DURATIONS } from "@/lib/utils/constants";
import type { Booking, Profile } from "@/types";

interface BookingConfirmationEmailProps {
  booking: Booking;
  student: Profile;
  appUrl: string;
}

export function generateBookingConfirmationHTML({
  booking,
  student,
  appUrl,
}: BookingConfirmationEmailProps): string {
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
      <p style="color: #1f2937; font-size: 18px; font-weight: bold; margin: 0 0 12px;">Video Call Link</p>
      <p style="color: #374151; font-size: 14px; line-height: 20px; margin: 4px 0;">Join your session using the link below:</p>
      <a href="${booking.video_link}" style="background-color: #18181b; border-radius: 6px; color: #ffffff; display: inline-block; font-size: 14px; font-weight: bold; padding: 12px 24px; text-decoration: none; margin: 12px 0;">Join Video Call</a>
      <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0;">Or copy this link: ${booking.video_link}</p>
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
    <h1 style="color: #1f2937; font-size: 24px; font-weight: bold; margin: 0 0 20px; padding: 0;">Booking Confirmed!</h1>

    <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 16px 0;">Hi ${student.full_name || "there"},</p>

    <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 16px 0;">
      Great news! Your <strong>${LESSON_TYPE_LABELS[booking.lesson_type]}</strong> session has been confirmed.
    </p>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="color: #1f2937; font-size: 18px; font-weight: bold; margin: 0 0 12px;">Lesson Details</p>
      <p style="color: #374151; font-size: 14px; line-height: 20px; margin: 4px 0;"><strong>Date:</strong> ${formattedDate}</p>
      <p style="color: #374151; font-size: 14px; line-height: 20px; margin: 4px 0;"><strong>Time:</strong> ${formattedTime}</p>
      <p style="color: #374151; font-size: 14px; line-height: 20px; margin: 4px 0;"><strong>Duration:</strong> ${LESSON_TYPE_DURATIONS[booking.lesson_type]} minutes</p>
      <p style="color: #374151; font-size: 14px; line-height: 20px; margin: 4px 0;"><strong>Type:</strong> ${LESSON_TYPE_LABELS[booking.lesson_type]}</p>
    </div>

    ${videoLinkSection}

    <hr style="border-color: #e5e7eb; margin: 24px 0;">

    <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 16px 0;"><strong>What's next?</strong></p>
    <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 16px 0;">
      1. Review your pre-study materials before the lesson<br>
      2. Make sure you have a stable internet connection<br>
      3. Join the video call 5 minutes before your scheduled time<br>
      4. Have your study materials ready
    </p>

    <hr style="border-color: #e5e7eb; margin: 24px 0;">

    <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 16px 0;">
      Need to make changes? You can view or cancel your booking from your dashboard:
    </p>
    <p style="margin: 16px 0;">
      <a href="${appUrl}/bookings/${booking.id}" style="color: #2563eb; text-decoration: underline;">View Booking Details</a>
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
