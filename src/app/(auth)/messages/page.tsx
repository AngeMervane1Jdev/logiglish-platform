import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { ChatContainer } from "@/components/chat";

export default async function MessagesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Messages
        </h1>
        <p className="mt-1 text-foreground-muted">
          Contact support or discuss your learning progress.
        </p>
      </div>

      {/* Chat Container */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Support Chat
          </CardTitle>
          <CardDescription>
            Send a message to our support team. We typically respond within 24
            hours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChatContainer
            studentId={user.id}
            currentUserId={user.id}
          />
        </CardContent>
      </Card>

      {/* Help Info */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-foreground-muted">
            <li>
              <strong>Booking Issues:</strong> If you need to reschedule or have
              questions about your booking, let us know.
            </li>
            <li>
              <strong>Technical Support:</strong> Having trouble with video calls
              or accessing materials? We&apos;re here to help.
            </li>
            <li>
              <strong>Account Questions:</strong> Questions about your plan or
              account settings? Just ask!
            </li>
            <li>
              <strong>Feedback:</strong> We love hearing your feedback about our
              lessons and platform.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
