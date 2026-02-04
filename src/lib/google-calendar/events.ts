import { getGoogleCalendarClient, getInstructorCalendarId, isGoogleCalendarConfigured } from "./client";
import { addMinutes } from "date-fns";
import { LESSON_TYPE_LABELS, LESSON_TYPE_DURATIONS } from "@/lib/utils/constants";
import type { LessonType, Profile } from "@/types";

export interface CalendarEventResult {
  success: boolean;
  eventId?: string;
  meetLink?: string;
  error?: string;
}

/**
 * Create a calendar event for a booking
 */
export async function createCalendarEvent(
  startTime: Date,
  lessonType: LessonType,
  student: Profile,
  bookingId: string
): Promise<CalendarEventResult> {
  // Skip if Google Calendar is not configured (development mode)
  if (!isGoogleCalendarConfigured()) {
    console.warn("Google Calendar not configured - skipping event creation");
    return {
      success: true, // Return success to allow booking to proceed
    };
  }

  const calendar = getGoogleCalendarClient();
  const calendarId = getInstructorCalendarId();
  const duration = LESSON_TYPE_DURATIONS[lessonType];
  const endTime = addMinutes(startTime, duration);

  // First, try to create event with Google Meet
  try {
    const response = await calendar.events.insert({
      calendarId,
      conferenceDataVersion: 1, // Enable Google Meet
      requestBody: {
        summary: `${LESSON_TYPE_LABELS[lessonType]} - ${student.full_name || student.email}`,
        description: `
Logiglish ${LESSON_TYPE_LABELS[lessonType]} Session

Student: ${student.full_name || "Unknown"}
Email: ${student.email}
Booking ID: ${bookingId}

Duration: ${duration} minutes
        `.trim(),
        start: {
          dateTime: startTime.toISOString(),
          timeZone: "UTC",
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: "UTC",
        },
        // Note: Service accounts cannot add attendees without Domain-Wide Delegation
        // Students will access the meeting link from their booking page
        conferenceData: {
          createRequest: {
            requestId: bookingId,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 }, // 24 hours before
            { method: "popup", minutes: 30 }, // 30 minutes before
          ],
        },
      },
    });

    const meetLink = response.data.conferenceData?.entryPoints?.find(
      (ep) => ep.entryPointType === "video"
    )?.uri;

    return {
      success: true,
      eventId: response.data.id!,
      meetLink: meetLink || undefined,
    };
  } catch (error) {
    console.error("Error creating calendar event with conference data:", error);

    // If conference creation fails, try creating a basic event without Google Meet
    try {
      console.log("Attempting to create event without conference data...");
      const response = await calendar.events.insert({
        calendarId,
        requestBody: {
          summary: `${LESSON_TYPE_LABELS[lessonType]} - ${student.full_name || student.email}`,
          description: `
Logiglish ${LESSON_TYPE_LABELS[lessonType]} Session

Student: ${student.full_name || "Unknown"}
Email: ${student.email}
Booking ID: ${bookingId}

Duration: ${duration} minutes

Note: Add a Google Meet link manually or use a third-party meeting platform.
          `.trim(),
          start: {
            dateTime: startTime.toISOString(),
            timeZone: "UTC",
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: "UTC",
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: "email", minutes: 24 * 60 }, // 24 hours before
              { method: "popup", minutes: 30 }, // 30 minutes before
            ],
          },
        },
      });

      console.log("Calendar event created without conference data. Add meeting link manually.");

      return {
        success: true,
        eventId: response.data.id!,
        // No meetLink - admin will need to add manually or use external platform
      };
    } catch (fallbackError) {
      console.error("Error creating basic calendar event:", fallbackError);
      return {
        success: false,
        error: fallbackError instanceof Error ? fallbackError.message : "Failed to create calendar event",
      };
    }
  }
}

/**
 * Update a calendar event
 */
export async function updateCalendarEvent(
  eventId: string,
  updates: {
    startTime?: Date;
    lessonType?: LessonType;
    student?: Profile;
  }
): Promise<CalendarEventResult> {
  const calendar = getGoogleCalendarClient();
  const calendarId = getInstructorCalendarId();

  try {
    // Get current event
    const currentEvent = await calendar.events.get({
      calendarId,
      eventId,
    });

    const updateData: Record<string, unknown> = {};

    if (updates.startTime && updates.lessonType) {
      const duration = LESSON_TYPE_DURATIONS[updates.lessonType];
      const endTime = addMinutes(updates.startTime, duration);

      updateData.start = {
        dateTime: updates.startTime.toISOString(),
        timeZone: "UTC",
      };
      updateData.end = {
        dateTime: endTime.toISOString(),
        timeZone: "UTC",
      };
    }

    if (updates.student && updates.lessonType) {
      updateData.summary = `${LESSON_TYPE_LABELS[updates.lessonType]} - ${updates.student.full_name || updates.student.email}`;
    }

    const response = await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: {
        ...currentEvent.data,
        ...updateData,
      },
    });

    const meetLink = response.data.conferenceData?.entryPoints?.find(
      (ep) => ep.entryPointType === "video"
    )?.uri;

    return {
      success: true,
      eventId: response.data.id!,
      meetLink: meetLink || undefined,
    };
  } catch (error) {
    console.error("Error updating calendar event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update calendar event",
    };
  }
}

/**
 * Cancel/delete a calendar event
 */
export async function cancelCalendarEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
  const calendar = getGoogleCalendarClient();
  const calendarId = getInstructorCalendarId();

  try {
    await calendar.events.delete({
      calendarId,
      eventId,
      // Note: Cannot send updates without Domain-Wide Delegation
    });

    return { success: true };
  } catch (error) {
    console.error("Error cancelling calendar event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cancel calendar event",
    };
  }
}

/**
 * Get a calendar event by ID
 */
export async function getCalendarEvent(eventId: string) {
  const calendar = getGoogleCalendarClient();
  const calendarId = getInstructorCalendarId();

  try {
    const response = await calendar.events.get({
      calendarId,
      eventId,
    });

    return {
      success: true,
      event: response.data,
    };
  } catch (error) {
    console.error("Error getting calendar event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get calendar event",
    };
  }
}
