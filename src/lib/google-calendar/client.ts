import { google, calendar_v3 } from "googleapis";

let calendarClient: calendar_v3.Calendar | null = null;

/**
 * Get authenticated Google Calendar client using service account
 * The service account needs to have domain-wide delegation enabled
 * and the calendar shared with it
 */
export function getGoogleCalendarClient(): calendar_v3.Calendar {
  if (!calendarClient) {
    const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    if (!credentials) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is not configured");
    }

    let serviceAccount: { client_email: string; private_key: string };

    try {
      serviceAccount = JSON.parse(credentials);
    } catch {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON");
    }

    // For Domain-Wide Delegation, specify the user to impersonate
    // This allows the service account to act on behalf of a real user
    const delegatedUser = process.env.GOOGLE_DELEGATED_USER_EMAIL;

    const auth = new google.auth.JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ["https://www.googleapis.com/auth/calendar"],
      // If Domain-Wide Delegation is set up, impersonate this user
      subject: delegatedUser || undefined,
    });

    calendarClient = google.calendar({ version: "v3", auth });
  }

  return calendarClient;
}

/**
 * Get the instructor's calendar ID from environment
 */
export function getInstructorCalendarId(): string {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!calendarId) {
    throw new Error("GOOGLE_CALENDAR_ID is not configured");
  }

  return calendarId;
}

/**
 * Check if Google Calendar is configured
 */
export function isGoogleCalendarConfigured(): boolean {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY &&
    process.env.GOOGLE_CALENDAR_ID
  );
}
