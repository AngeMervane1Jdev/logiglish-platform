import Link from "next/link";
import { Calendar, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle, Button } from "@/components/ui";
import { formatDateTime, getRelativeTime } from "@/lib/utils/date";
import { LESSON_TYPE_LABELS } from "@/lib/utils/constants";
import type { Booking } from "@/types";

interface ActiveBookingBannerProps {
  booking: Booking;
}

export function ActiveBookingBanner({ booking }: ActiveBookingBannerProps) {
  return (
    <Alert variant="warning" className="mb-6">
      <AlertCircle className="h-5 w-5" />
      <div className="flex-1">
        <AlertTitle>You have an active booking</AlertTitle>
        <AlertDescription className="mt-2">
          <p>
            Your{" "}
            <span className="font-medium">
              {LESSON_TYPE_LABELS[booking.lesson_type]}
            </span>{" "}
            is scheduled for{" "}
            <span className="font-medium">
              {formatDateTime(booking.scheduled_at)}
            </span>{" "}
            ({getRelativeTime(booking.scheduled_at)}).
          </p>
          <p className="mt-2 text-sm">
            You can only have one active booking at a time. Please complete or
            cancel your current booking to schedule a new lesson.
          </p>
          <div className="mt-4 flex gap-2">
            <Button size="sm" asChild>
              <Link href={`/bookings/${booking.id}`}>
                <Calendar className="mr-2 h-4 w-4" />
                View Booking
              </Link>
            </Button>
          </div>
        </AlertDescription>
      </div>
    </Alert>
  );
}
