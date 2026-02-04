import { NextResponse } from "next/server";
import { getGoogleCalendarClient, getInstructorCalendarId, isGoogleCalendarConfigured } from "@/lib/google-calendar/client";

/**
 * Test endpoint to verify Google Calendar configuration
 * Access at: /api/test-calendar
 */
export async function GET() {
  try {
    // Check if configured
    const isConfigured = isGoogleCalendarConfigured();

    if (!isConfigured) {
      return NextResponse.json({
        success: false,
        error: "Google Calendar is not configured",
        details: {
          hasServiceAccountKey: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
          hasCalendarId: !!process.env.GOOGLE_CALENDAR_ID,
        },
      }, { status: 400 });
    }

    // Get calendar ID
    const calendarId = getInstructorCalendarId();

    // Try to get the calendar client
    const calendar = getGoogleCalendarClient();

    // Test by fetching calendar metadata
    const calendarInfo = await calendar.calendars.get({
      calendarId,
    });

    // Try to list recent events (just 1 to test permissions)
    const events = await calendar.events.list({
      calendarId,
      maxResults: 1,
      singleEvents: true,
      orderBy: "startTime",
    });

    return NextResponse.json({
      success: true,
      message: "Google Calendar is properly configured and accessible",
      calendarInfo: {
        id: calendarInfo.data.id,
        summary: calendarInfo.data.summary,
        timeZone: calendarInfo.data.timeZone,
      },
      permissions: {
        canReadCalendar: true,
        canReadEvents: true,
        eventsCount: events.data.items?.length || 0,
      },
    });

  } catch (error: any) {
    console.error("Calendar test error:", error);

    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error",
      errorCode: error.code,
      errorStatus: error.status,
      details: {
        type: error.constructor.name,
        hasServiceAccountKey: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
        hasCalendarId: !!process.env.GOOGLE_CALENDAR_ID,
      },
    }, { status: 500 });
  }
}
