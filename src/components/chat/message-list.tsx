"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./message-bubble";
import { Skeleton } from "@/components/ui";
import type { MessageWithAuthor } from "@/types";

interface MessageListProps {
  messages: MessageWithAuthor[];
  currentUserId: string;
  isLoading?: boolean;
}

export function MessageList({
  messages,
  currentUserId,
  isLoading,
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "flex",
              i % 2 === 0 ? "justify-end" : "justify-start"
            )}
          >
            <Skeleton className="h-16 w-48 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-foreground-muted text-center">
          No messages yet. Start the conversation!
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isOwnMessage={message.author_id === currentUserId}
        />
      ))}
      <div ref={endRef} />
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
