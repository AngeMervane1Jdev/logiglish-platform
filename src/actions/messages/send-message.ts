"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types";

const sendMessageSchema = z.object({
  studentId: z.string().uuid(),
  topicId: z.string().uuid().optional(),
  content: z.string().min(1).max(5000),
});

export async function sendMessage(
  data: z.infer<typeof sendMessageSchema>
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be logged in to send messages",
    };
  }

  const parsed = sendMessageSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
    };
  }

  const { studentId, topicId, content } = parsed.data;

  // Verify access - user must be the student, admin, or instructor
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const isInstructor = profile?.role === "instructor";
  const isOwnConversation = user.id === studentId;

  if (!isAdmin && !isInstructor && !isOwnConversation) {
    return {
      success: false,
      error: "You don't have permission to send messages in this conversation",
    };
  }

  // Create the message
  const { error } = await supabase.from("messages").insert({
    student_id: studentId,
    topic_id: topicId || null,
    author_id: user.id,
    content,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error sending message:", error);
    return {
      success: false,
      error: "Failed to send message",
    };
  }

  revalidatePath("/messages");
  revalidatePath("/admin/messages");

  return { success: true };
}
