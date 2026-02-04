import Link from "next/link";
import { Calendar, Clock, Video, ExternalLink } from "lucide-react";
import { Card, CardContent, CardFooter, Button } from "@/components/ui";
import { BookingStatusBadge } from "./booking-status-badge";
import { formatDateTime, formatDuration, isFuture } from "@/lib/utils/date";
import { LESSON_TYPE_LABELS, LESSON_TYPE_DURATIONS } from "@/lib/utils/constants";
import type { Booking } from "@/types";

interface BookingCardProps {
  booking: Booking;
  showActions?: boolean;
}

export function BookingCard({ booking, showActions = true }: BookingCardProps) {
  const isUpcoming = isFuture(booking.scheduled_at);
  const canJoinVideo =
    booking.video_link &&
    booking.status === "confirmed" &&
    isUpcoming;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
              {LESSON_TYPE_LABELS[booking.lesson_type]}
            </h3>
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <Calendar className="h-4 w-4" />
              {formatDateTime(booking.scheduled_at)}
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <Clock className="h-4 w-4" />
              {formatDuration(LESSON_TYPE_DURATIONS[booking.lesson_type])}
            </div>
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>

        {booking.notes && (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            {booking.notes}
          </p>
        )}
      </CardContent>

      {showActions && (
        <CardFooter className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/bookings/${booking.id}`}>View Details</Link>
          </Button>

          {canJoinVideo && (
            <Button size="sm" asChild>
              <a
                href={booking.video_link!}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Video className="mr-2 h-4 w-4" />
                Join Video
                <ExternalLink className="ml-2 h-3 w-3" />
              </a>
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
