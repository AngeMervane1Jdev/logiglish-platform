"use client";

import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { Alert, AlertDescription } from "@/components/ui";

interface ChatContainerProps {
  studentId: string;
  currentUserId: string;
  topicId?: string;
}

export function ChatContainer({
  studentId,
  currentUserId,
  topicId,
}: ChatContainerProps) {
  const { messages, isLoading, error, sendMessage } = useRealtimeMessages({
    studentId,
    topicId,
  });

  const handleSend = async (content: string): Promise<boolean> => {
    return sendMessage(content, currentUserId);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load messages. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex h-[600px] flex-col rounded-lg border border-border bg-background">
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        isLoading={isLoading}
      />
      <MessageInput onSend={handleSend} />
    </div>
  );
}
