"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MessageWithAuthor } from "@/types";

interface UseRealtimeMessagesOptions {
  studentId: string;
  topicId?: string;
}

interface UseRealtimeMessagesReturn {
  messages: MessageWithAuthor[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (content: string, authorId: string) => Promise<boolean>;
}

export function useRealtimeMessages({
  studentId,
  topicId,
}: UseRealtimeMessagesOptions): UseRealtimeMessagesReturn {
  const [messages, setMessages] = useState<MessageWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Memoize the supabase client to prevent recreation on each render
  const supabase = useMemo(() => createClient(), []);

  // Fetch initial messages
  useEffect(() => {
    async function fetchMessages() {
      setIsLoading(true);
      setError(null);

      try {
        let query = supabase
          .from("messages")
          .select(
            `
            *,
            author:profiles!messages_author_id_fkey(*)
          `
          )
          .eq("student_id", studentId)
          .order("created_at", { ascending: true });

        if (topicId) {
          query = query.eq("topic_id", topicId);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        setMessages((data || []) as MessageWithAuthor[]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch messages"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchMessages();
  }, [studentId, topicId]);

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${studentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `student_id=eq.${studentId}`,
        },
        async (payload) => {
          // Fetch the full message with author
          const { data } = await supabase
            .from("messages")
            .select(
              `
              *,
              author:profiles!messages_author_id_fkey(*)
            `
            )
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data as MessageWithAuthor]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId, supabase]);

  // Send a message
  const sendMessage = useCallback(
    async (content: string, authorId: string): Promise<boolean> => {
      try {
        const { error: sendError } = await supabase.from("messages").insert({
          student_id: studentId,
          topic_id: topicId || null,
          author_id: authorId,
          content,
          created_at: new Date().toISOString(),
        });

        if (sendError) throw sendError;

        return true;
      } catch (err) {
        console.error("Failed to send message:", err);
        return false;
      }
    },
    [studentId, topicId, supabase]
  );

  return {
    messages,
    isLoading,
    error,
    sendMessage,
  };
}
