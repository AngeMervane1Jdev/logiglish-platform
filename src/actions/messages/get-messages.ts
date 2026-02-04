"use server";

import { createClient } from "@/lib/supabase/server";
import type { MessageWithAuthor, ActionResult } from "@/types";

interface GetMessagesOptions {
  studentId?: string;
  topicId?: string;
  limit?: number;
}

/**
 * Get messages for the current user or a specific student (admin only)
 */
export async function getMessages(
  options: GetMessagesOptions = {}
): Promise<ActionResult<MessageWithAuthor[]>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be logged in to view messages",
    };
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const isInstructor = profile?.role === "instructor";

  // Determine which student's messages to fetch
  let targetStudentId = options.studentId;

  // If not admin/instructor, can only view own messages
  if (!isAdmin && !isInstructor) {
    targetStudentId = user.id;
  }

  if (!targetStudentId) {
    return {
      success: false,
      error: "Student ID is required",
    };
  }

  // Build query
  let query = supabase
    .from("messages")
    .select(
      `
      *,
      author:profiles!messages_author_id_fkey(*)
    `
    )
    .eq("student_id", targetStudentId)
    .order("created_at", { ascending: true });

  if (options.topicId) {
    query = query.eq("topic_id", options.topicId);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching messages:", error);
    return {
      success: false,
      error: "Failed to fetch messages",
    };
  }

  return {
    success: true,
    data: (data || []) as MessageWithAuthor[],
  };
}

/**
 * Get all conversations (admin only)
 */
export async function getConversations(): Promise<
  ActionResult<{ studentId: string; studentName: string; lastMessage: string; lastMessageAt: string }[]>
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { success: false, error: "Admin access required" };
  }

  // Get unique students with messages
  const { data: messages, error } = await supabase
    .from("messages")
    .select(
      `
      student_id,
      content,
      created_at,
      student:profiles!messages_student_id_fkey(full_name, email)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching conversations:", error);
    return { success: false, error: "Failed to fetch conversations" };
  }

  // Group by student and get last message
  const conversationMap = new Map<
    string,
    { studentId: string; studentName: string; lastMessage: string; lastMessageAt: string }
  >();

  for (const msg of messages || []) {
    if (!conversationMap.has(msg.student_id)) {
      const student = msg.student as unknown as { full_name: string | null; email: string } | null;
      conversationMap.set(msg.student_id, {
        studentId: msg.student_id,
        studentName: student?.full_name || student?.email || "Unknown",
        lastMessage: msg.content,
        lastMessageAt: msg.created_at,
      });
    }
  }

  return {
    success: true,
    data: Array.from(conversationMap.values()),
  };
}
