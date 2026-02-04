import { cn } from "@/lib/utils/cn";
import { formatTime } from "@/lib/utils/date";
import type { MessageWithAuthor } from "@/types";

interface MessageBubbleProps {
  message: MessageWithAuthor;
  isOwnMessage: boolean;
}

export function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex flex-col max-w-[80%]",
        isOwnMessage ? "ml-auto items-end" : "mr-auto items-start"
      )}
    >
      <div
        className={cn(
          "rounded-lg px-4 py-2",
          isOwnMessage
            ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
            : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
      <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
        <span>{message.author?.full_name || "Unknown"}</span>
        <span>·</span>
        <span>{formatTime(message.created_at)}</span>
      </div>
    </div>
  );
}
