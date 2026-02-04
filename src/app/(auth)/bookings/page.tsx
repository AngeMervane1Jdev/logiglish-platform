import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Plus, Calendar } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Skeleton,
  Alert,
  AlertDescription,
} from "@/components/ui";
import { BookingCard } from "@/components/booking";
import type { Booking } from "@/types";

async function BookingsList() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get all bookings
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("student_id", user.id)
    .order("scheduled_at", { ascending: false });

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load bookings. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  const typedBookings = (bookings || []) as Booking[];

  // Separate bookings by status
  const upcomingBookings = typedBookings.filter(
    (b) => b.status === "pending" || b.status === "confirmed"
  );
  const pastBookings = typedBookings.filter(
    (b) => b.status === "completed" || b.status === "cancelled"
  );

  if (typedBookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="mb-4 h-12 w-12 text-zinc-400" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            No bookings yet
          </h3>
          <p className="mt-1 text-center text-sm text-zinc-500 dark:text-zinc-400">
            You haven&apos;t scheduled any lessons yet. Book your first session
            to get started!
          </p>
          <Button className="mt-4" asChild>
            <Link href="/book">
              <Plus className="mr-2 h-4 w-4" />
              Book a Lesson
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Upcoming Lessons
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </div>
      )}

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Past Lessons
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pastBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BookingsListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ scheduled?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {params.scheduled === "true" && (
        <Alert variant="success">
          <AlertDescription>
            Your lesson has been scheduled successfully! You will receive a
            confirmation email shortly with details and a video call link.
          </AlertDescription>
        </Alert>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            My Bookings
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            View and manage your scheduled lessons.
          </p>
        </div>
        <Button asChild>
          <Link href="/book">
            <Plus className="mr-2 h-4 w-4" />
            Book New Lesson
          </Link>
        </Button>
      </div>

      {/* Bookings List */}
      <Suspense fallback={<BookingsListSkeleton />}>
        <BookingsList />
      </Suspense>
    </div>
  );
}
