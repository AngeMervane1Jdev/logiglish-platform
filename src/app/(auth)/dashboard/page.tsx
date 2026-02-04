import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, BookOpen, MessageSquare, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from "@/components/ui";
import { formatDateTime, getRelativeTime } from "@/lib/utils/date";
import { BOOKING_STATUS_COLORS, LESSON_TYPE_LABELS } from "@/lib/utils/constants";
import type { Booking, Profile } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get active booking (pending or confirmed)
  const { data: activeBooking } = await supabase
    .from("bookings")
    .select("*")
    .eq("student_id", user.id)
    .in("status", ["pending", "confirmed"])
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .single();

  // Get recent bookings
  const { data: recentBookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Get unread messages count
  const { count: unreadMessages } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("student_id", user.id)
    .neq("author_id", user.id);

  const typedProfile = profile as Profile | null;
  const typedActiveBooking = activeBooking as Booking | null;
  const typedRecentBookings = (recentBookings || []) as Booking[];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {typedProfile?.full_name?.split(" ")[0] || "Student"}!
        </h1>
        <p className="mt-1 text-foreground-muted">
          Here&apos;s an overview of your learning progress.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Booking</CardTitle>
            <Calendar className="h-4 w-4 text-foreground-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {typedActiveBooking ? "1" : "0"}
            </div>
            <p className="text-xs text-foreground-muted">
              {typedActiveBooking
                ? getRelativeTime(typedActiveBooking.scheduled_at)
                : "No upcoming lessons"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
            <BookOpen className="h-4 w-4 text-foreground-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {typedRecentBookings.filter((b) => b.status === "completed").length}
            </div>
            <p className="text-xs text-foreground-muted">Completed sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-foreground-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadMessages || 0}</div>
            <p className="text-xs text-foreground-muted">Unread messages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Plan</CardTitle>
            <Clock className="h-4 w-4 text-foreground-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {typedProfile?.subscription_plan || "Basic"}
            </div>
            <p className="text-xs text-foreground-muted">
              {typedProfile?.subscription_plan === "premium"
                ? "Full access"
                : "Limited features"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Booking Banner */}
      {typedActiveBooking && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <Calendar className="h-5 w-5" />
              Upcoming Lesson
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              Your next scheduled session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  {LESSON_TYPE_LABELS[typedActiveBooking.lesson_type]}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {formatDateTime(typedActiveBooking.scheduled_at)}
                </p>
                <Badge
                  variant={
                    BOOKING_STATUS_COLORS[typedActiveBooking.status] === "green"
                      ? "success"
                      : BOOKING_STATUS_COLORS[typedActiveBooking.status] === "yellow"
                      ? "warning"
                      : "secondary"
                  }
                  className="mt-2"
                >
                  {typedActiveBooking.status}
                </Badge>
              </div>
              <div className="flex gap-2">
                {typedActiveBooking.video_link && (
                  <Button asChild>
                    <a
                      href={typedActiveBooking.video_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Join Video Call
                    </a>
                  </Button>
                )}
                <Button variant="outline" asChild>
                  <Link href={`/bookings/${typedActiveBooking.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Book a Lesson</CardTitle>
            <CardDescription>
              Schedule your next Response Practice session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/book">
                {typedActiveBooking ? "View Booking Options" : "Book Now"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>View Topics</CardTitle>
            <CardDescription>
              Access your learning materials and assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full">
              <Link href="/topics">Browse Topics</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
            <CardDescription>
              Contact support or view conversation history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full">
              <Link href="/messages">View Messages</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      {typedRecentBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Your booking history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {typedRecentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {LESSON_TYPE_LABELS[booking.lesson_type]}
                    </p>
                    <p className="text-sm text-foreground-muted">
                      {formatDateTime(booking.scheduled_at)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      booking.status === "completed"
                        ? "success"
                        : booking.status === "cancelled"
                        ? "destructive"
                        : booking.status === "confirmed"
                        ? "default"
                        : "warning"
                    }
                  >
                    {booking.status}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="link" asChild className="mt-4 p-0">
              <Link href="/bookings">View all bookings</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
