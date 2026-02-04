// ============================================
// Database Enums
// ============================================

export type LessonType = "response_practice" | "micro_response_practice";
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type UserRole = "student" | "instructor" | "admin";
export type SubscriptionPlan = "basic" | "premium";
export type MaterialType = "pre_study_pdf" | "assignment" | "feedback" | "audio";

// ============================================
// Database Tables
// ============================================

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  subscription_plan: SubscriptionPlan;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: string;
  title: string;
  description: string | null;
  sequence_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  student_id: string;
  instructor_id: string | null;
  topic_id: string | null;
  lesson_type: LessonType;
  status: BookingStatus;
  scheduled_at: string;
  calendar_event_id: string | null;
  video_link: string | null;
  notes: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface TopicMaterial {
  id: string;
  topic_id: string;
  material_type: MaterialType;
  title: string;
  file_url: string | null;
  message_content: string | null;
  sequence_order: number;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentSubmission {
  id: string;
  student_id: string;
  topic_id: string;
  material_id: string;
  file_url: string | null;
  submitted_at: string;
  feedback_url: string | null;
  feedback_at: string | null;
}

export interface Message {
  id: string;
  topic_id: string | null;
  student_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

// ============================================
// Extended Types with Relations
// ============================================

export interface BookingWithRelations extends Booking {
  student: Profile;
  instructor: Profile | null;
  topic: Topic | null;
}

export interface MessageWithAuthor extends Message {
  author: Profile;
}

// ============================================
// API / Action Types
// ============================================

export interface BookingEligibility {
  canBook: boolean;
  reason?: string;
  activeBooking?: Booking | null;
}

export interface CreateBookingInput {
  lesson_type: LessonType;
  scheduled_at: string;
  calendar_event_id?: string;
  topic_id?: string;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// ============================================
// Email Types
// ============================================

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface BookingEmailData {
  booking: Booking;
  student: Profile;
  instructor?: Profile | null;
  topic?: Topic | null;
  videoLink?: string;
  icsContent?: string;
}
