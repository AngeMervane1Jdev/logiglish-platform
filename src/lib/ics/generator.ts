import { createEvents, type EventAttributes } from "ics";
import { LESSON_TYPE_LABELS, LESSON_TYPE_DURATIONS } from "@/lib/utils/constants";
import type { Booking, Profile } from "@/types";

/**
 * Generate ICS calendar file content for a booking
 */
export function generateICS(booking: Booking, student: Profile): string {
  const scheduledDate = new Date(booking.scheduled_at);
  const duration = LESSON_TYPE_DURATIONS[booking.lesson_type];

  const event: EventAttributes = {
    start: [
      scheduledDate.getUTCFullYear(),
      scheduledDate.getUTCMonth() + 1, // ICS months are 1-indexed
      scheduledDate.getUTCDate(),
      scheduledDate.getUTCHours(),
      scheduledDate.getUTCMinutes(),
    ],
    duration: { minutes: duration },
    title: `Logiglish - ${LESSON_TYPE_LABELS[booking.lesson_type]}`,
    description: generateDescription(booking),
    location: booking.video_link || "Online",
    url: booking.video_link || undefined,
    status: "CONFIRMED",
    busyStatus: "BUSY",
    organizer: { name: "Logiglish", email: "noreply@logiglish.com" },
    attendees: [
      {
        name: student.full_name || student.email,
        email: student.email,
        rsvp: true,
        partstat: "ACCEPTED",
        role: "REQ-PARTICIPANT",
      },
    ],
    alarms: [
      // Reminder 1 hour before
      {
        action: "display",
        description: "Your Logiglish lesson starts in 1 hour",
        trigger: { hours: 1, minutes: 0, before: true },
      },
      // Reminder 15 minutes before
      {
        action: "display",
        description: "Your Logiglish lesson starts in 15 minutes",
        trigger: { hours: 0, minutes: 15, before: true },
      },
    ],
  };

  const { error, value } = createEvents([event]);

  if (error) {
    console.error("Error generating ICS:", error);
    // Return a basic ICS as fallback
    return generateBasicICS(booking, student);
  }

  return value || generateBasicICS(booking, student);
}

/**
 * Generate description text for the calendar event
 */
function generateDescription(booking: Booking): string {
  const lines = [
    `Lesson Type: ${LESSON_TYPE_LABELS[booking.lesson_type]}`,
    `Duration: ${LESSON_TYPE_DURATIONS[booking.lesson_type]} minutes`,
    "",
    "Preparation:",
    "- Review your pre-study materials",
    "- Test your camera and microphone",
    "- Find a quiet space with good internet",
    "",
  ];

  if (booking.video_link) {
    lines.push(`Video Call Link: ${booking.video_link}`);
  }

  lines.push("", "Need help? Contact support@logiglish.com");

  return lines.join("\\n");
}

/**
 * Generate a basic ICS file manually (fallback)
 */
function generateBasicICS(booking: Booking, student: Profile): string {
  const scheduledDate = new Date(booking.scheduled_at);
  const endDate = new Date(
    scheduledDate.getTime() +
      LESSON_TYPE_DURATIONS[booking.lesson_type] * 60 * 1000
  );

  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const uid = `${booking.id}@logiglish.com`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Logiglish//Booking System//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(scheduledDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:Logiglish - ${LESSON_TYPE_LABELS[booking.lesson_type]}`,
    `DESCRIPTION:${generateDescription(booking)}`,
    booking.video_link ? `LOCATION:${booking.video_link}` : "LOCATION:Online",
    `ORGANIZER;CN=Logiglish:mailto:noreply@logiglish.com`,
    `ATTENDEE;CN=${student.full_name || student.email};RSVP=TRUE:mailto:${student.email}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Your Logiglish lesson starts in 1 hour",
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Your Logiglish lesson starts in 15 minutes",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return ics;
}

export default generateICS;
