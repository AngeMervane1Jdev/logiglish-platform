"use client";

import { useState, useEffect } from "react";
import { MessageSquare, User, Clock } from "lucide-react";
import { getConversations } from "@/actions/messages";
import { ChatContainer } from "@/components/chat";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { getRelativeTime } from "@/lib/utils/date";
import { useUser } from "@/hooks/use-user";

interface Conversation {
  studentId: string;
  studentName: string;
  lastMessage: string;
  lastMessageAt: string;
}

export default function AdminMessagesPage() {
  const { user } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(
    null
  );

  useEffect(() => {
    async function fetchConversations() {
      setIsLoading(true);
      const result = await getConversations();

      if (result.success && result.data) {
        setConversations(result.data);
        // Auto-select first conversation
        if (result.data.length > 0 && !selectedConversation) {
          setSelectedConversation(result.data[0].studentId);
        }
      }
      setIsLoading(false);
    }

    fetchConversations();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Messages
        </h1>
        <p className="mt-1 text-foreground-muted">
          View and respond to student messages.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
            <CardDescription>
              {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <MessageSquare className="mb-2 h-8 w-8 text-foreground-muted" />
                <p className="text-sm text-foreground-muted">No conversations yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.studentId}
                    onClick={() => setSelectedConversation(conversation.studentId)}
                    className={cn(
                      "w-full p-4 text-left transition-colors hover:bg-accent",
                      selectedConversation === conversation.studentId &&
                        "bg-background-tertiary"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background-tertiary">
                        <User className="h-5 w-5 text-foreground-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {conversation.studentName}
                        </p>
                        <p className="text-sm text-foreground-muted truncate">
                          {conversation.lastMessage}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-foreground-muted">
                          <Clock className="h-3 w-3" />
                          {getRelativeTime(conversation.lastMessageAt)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedConversation
                ? conversations.find((c) => c.studentId === selectedConversation)
                    ?.studentName || "Chat"
                : "Select a Conversation"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedConversation && user ? (
              <ChatContainer
                studentId={selectedConversation}
                currentUserId={user.id}
              />
            ) : (
              <div className="flex h-[600px] items-center justify-center rounded-lg border border-border bg-background-secondary">
                <div className="text-center">
                  <MessageSquare className="mx-auto mb-2 h-12 w-12 text-foreground-muted" />
                  <p className="text-foreground-muted">
                    Select a conversation to view messages
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
