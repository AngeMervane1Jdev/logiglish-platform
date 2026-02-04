"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  ExternalLink,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { getBookingById, cancelBooking } from "@/actions/booking";
import { BookingStatusBadge } from "@/components/booking";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Textarea,
  useToast,
} from "@/components/ui";
import {
  formatDate,
  formatTime,
  formatDuration,
  isFuture,
  getRelativeTime,
} from "@/lib/utils/date";
import { LESSON_TYPE_LABELS, LESSON_TYPE_DURATIONS } from "@/lib/utils/constants";
import type { Booking } from "@/types";

function BookingDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  const bookingId = params.id as string;
  const isNewBooking = searchParams.get("success") === "true";

  const fetchBooking = useCallback(async (retryCount = 0): Promise<boolean> => {
    const result = await getBookingById(bookingId);

    if (result.success && result.data) {
      setBooking(result.data);
      setError(null);
      return true;
    } else {
      // If this is a new booking and fetch failed, retry more aggressively
      if (isNewBooking && retryCount < 8) {
        // Exponential backoff: 500ms, 1s, 1.5s, 2s, 2.5s, 3s, 3.5s, 4s
        const delay = 500 + (retryCount * 500);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchBooking(retryCount + 1);
      }
      setError(result.error || "Booking not found");
      return false;
    }
  }, [bookingId, isNewBooking]);

  useEffect(() => {
    async function loadBooking() {
      setIsLoading(true);
      const success = await fetchBooking();
      if (success && isNewBooking) {
        setShowSuccessBanner(true);
      }
      setIsLoading(false);
    }

    loadBooking();
  }, [fetchBooking, isNewBooking]);

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error("Reason required", "Please provide a reason for cancellation");
      return;
    }

    setIsCancelling(true);
    const result = await cancelBooking(bookingId, cancelReason.trim());

    if (result.success) {
      toast.success("Booking cancelled", "Your booking has been cancelled successfully.");
      setShowCancelDialog(false);
      router.push("/bookings");
    } else {
      toast.error("Failed to cancel", result.error || "An error occurred");
    }
    setIsCancelling(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/bookings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bookings
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error || "Booking not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isUpcoming = isFuture(booking.scheduled_at);
  const canCancel =
    (booking.status === "pending" || booking.status === "confirmed") && isUpcoming;
  const canJoinVideo = booking.video_link && booking.status === "confirmed" && isUpcoming;

  return (
    <div className="space-y-6">
      {/* Success Banner for New Bookings */}
      {showSuccessBanner && (
        <Alert variant="success" className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Your booking request has been submitted! You will receive a confirmation email with the Google Meet link once an admin approves your booking.
          </AlertDescription>
        </Alert>
      )}

      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href="/bookings">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Bookings
        </Link>
      </Button>

      {/* Booking Details */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">
                {LESSON_TYPE_LABELS[booking.lesson_type]}
              </CardTitle>
              <CardDescription className="mt-1">
                Booking ID: {booking.id.slice(0, 8)}
              </CardDescription>
            </div>
            <BookingStatusBadge status={booking.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date & Time */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-5 w-5 text-zinc-500" />
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {formatDate(booking.scheduled_at)}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {getRelativeTime(booking.scheduled_at)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 text-zinc-500" />
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {formatTime(booking.scheduled_at)}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {formatDuration(LESSON_TYPE_DURATIONS[booking.lesson_type])} session
                </p>
              </div>
            </div>
          </div>

          {/* Video Link */}
          {booking.video_link && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
              <div className="flex items-start gap-3">
                <Video className="mt-0.5 h-5 w-5 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    Google Meet Link
                  </p>
                  <a
                    href={booking.video_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {booking.video_link}
                  </a>
                  {canJoinVideo && (
                    <Button className="mt-3" asChild>
                      <a
                        href={booking.video_link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Join Video Call
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {!canJoinVideo && isUpcoming && booking.status === "confirmed" && (
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      Save this link! You can join the call at your scheduled time.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* No video link yet */}
          {!booking.video_link && booking.status === "pending" && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
              <div className="flex items-start gap-3">
                <Video className="mt-0.5 h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <div className="flex-1">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    Video Link Pending
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    The Google Meet link will be generated once your booking is confirmed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {booking.notes && (
            <div>
              <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Notes</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {booking.notes}
              </p>
            </div>
          )}

          {/* Actions */}
          {canCancel && (
            <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
              <Button variant="destructive" onClick={() => setShowCancelDialog(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Cancel Booking
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent onClose={() => setShowCancelDialog(false)}>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Reason for cancellation <span className="text-red-600">*</span>
            </label>
            <Textarea
              className="mt-2"
              placeholder="Please let us know why you're cancelling..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              isLoading={isCancelling}
            >
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BookingDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function BookingDetailPage() {
  return (
    <Suspense fallback={<BookingDetailSkeleton />}>
      <BookingDetailContent />
    </Suspense>
  );
}
