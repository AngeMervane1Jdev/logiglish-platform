// ============================================
// Booking Constants
// ============================================

export const BOOKING_DEADLINE_HOURS = 36;

export const LESSON_TYPE_LABELS = {
  response_practice: "Response Practice",
  micro_response_practice: "Micro Response Practice",
} as const;

export const LESSON_TYPE_DURATIONS = {
  response_practice: 30, // minutes
  micro_response_practice: 15, // minutes
} as const;

export const BOOKING_STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
} as const;

export const BOOKING_STATUS_COLORS = {
  pending: "yellow",
  confirmed: "blue",
  completed: "green",
  cancelled: "red",
} as const;

// ============================================
// User Constants
// ============================================

export const USER_ROLE_LABELS = {
  student: "Student",
  instructor: "Instructor",
  admin: "Admin",
} as const;

export const SUBSCRIPTION_PLAN_LABELS = {
  basic: "Basic",
  premium: "Premium",
} as const;

// ============================================
// Route Constants
// ============================================

export const PROTECTED_ROUTES = [
  "/dashboard",
  "/book",
  "/bookings",
  "/messages",
  "/topics",
] as const;

export const ADMIN_ROUTES = ["/admin"] as const;

export const INSTRUCTOR_ROUTES = ["/instructor"] as const;

export const PUBLIC_ROUTES = ["/", "/login", "/signup"] as const;

// ============================================
// API Routes
// ============================================

export const API_ROUTES = {
  ICS_DOWNLOAD: "/api/ics",
} as const;

// ============================================
// Email Constants
// ============================================

export const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@logiglish.com";

export const EMAIL_SUBJECTS = {
  BOOKING_CONFIRMATION: "Your Booking is Confirmed - Logiglish",
  BOOKING_REMINDER: "Reminder: Your Lesson is Tomorrow - Logiglish",
  BOOKING_CANCELLED: "Booking Cancelled - Logiglish",
  NEW_MESSAGE: "New Message - Logiglish",
} as const;

// ============================================
// Validation Constants
// ============================================

export const MAX_MESSAGE_LENGTH = 5000;
export const MAX_FILE_SIZE_MB = 10;
export const ALLOWED_FILE_TYPES = [".pdf", ".doc", ".docx"];
