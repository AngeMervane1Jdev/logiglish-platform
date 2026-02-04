"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  User,
  Mail,
  Crown,
  Check,
  X,
  Edit2,
  Plus,
  ExternalLink,
} from "lucide-react";
import { getAllBookings, updateBooking } from "@/actions/admin";
import { BookingStatusBadge } from "@/components/booking";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Skeleton,
  Alert,
  AlertDescription,
  Textarea,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  useToast,
} from "@/components/ui";
import {
  formatDateTime,
  formatDate,
  formatTime,
  formatDuration,
} from "@/lib/utils/date";
import { LESSON_TYPE_LABELS, LESSON_TYPE_DURATIONS } from "@/lib/utils/constants";
import type { BookingWithRelations, BookingStatus } from "@/types";

export default function AdminBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();

  const [booking, setBooking] = useState<BookingWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editNotes, setEditNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Meeting link state
  const [editMeetingLink, setEditMeetingLink] = useState("");
  const [isEditingMeetingLink, setIsEditingMeetingLink] = useState(false);
  const [isUpdatingMeetingLink, setIsUpdatingMeetingLink] = useState(false);

  const bookingId = params.id as string;

  useEffect(() => {
    async function fetchBooking() {
      setIsLoading(true);
      const result = await getAllBookings({ limit: 1 });

      if (result.success && result.data) {
        const found = result.data.bookings.find((b) => b.id === bookingId);
        if (found) {
          setBooking(found);
          setEditNotes(found.notes || "");
          setEditMeetingLink(found.video_link || "");
        } else {
          // Fetch again with no limit to find the specific booking
          const allResult = await getAllBookings({ limit: 1000 });
          if (allResult.success && allResult.data) {
            const foundBooking = allResult.data.bookings.find(
              (b) => b.id === bookingId
            );
            if (foundBooking) {
              setBooking(foundBooking);
              setEditNotes(foundBooking.notes || "");
              setEditMeetingLink(foundBooking.video_link || "");
            } else {
              setError("Booking not found");
            }
          }
        }
      } else {
        setError(result.error || "Failed to load booking");
      }
      setIsLoading(false);
    }

    fetchBooking();
  }, [bookingId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
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
          <Link href="/admin/bookings">
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

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href="/admin/bookings">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Bookings
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Details */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    {LESSON_TYPE_LABELS[booking.lesson_type]}
                  </CardTitle>
                  <CardDescription>
                    Booking ID: {booking.id.slice(0, 8)}
                  </CardDescription>
                </div>
                <BookingStatusBadge status={booking.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Schedule */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-5 w-5 text-zinc-500" />
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {formatDate(booking.scheduled_at)}
                    </p>
                    <p className="text-sm text-zinc-500">Scheduled date</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 text-zinc-500" />
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {formatTime(booking.scheduled_at)}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {formatDuration(LESSON_TYPE_DURATIONS[booking.lesson_type])}
                    </p>
                  </div>
                </div>
              </div>

              {/* Meeting Link Section */}
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <Video className="mt-0.5 h-5 w-5 text-zinc-500" />
                    <div className="flex-1">
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">
                        Meeting Link
                      </p>

                      {!isEditingMeetingLink && booking.video_link && (
                        <div className="mt-1 flex items-center gap-2">
                          <a
                            href={booking.video_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            {booking.video_link.length > 50
                              ? booking.video_link.substring(0, 50) + "..."
                              : booking.video_link}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}

                      {!isEditingMeetingLink && !booking.video_link && (
                        <p className="mt-1 text-sm text-zinc-500">
                          No meeting link added yet
                        </p>
                      )}

                      {isEditingMeetingLink && (
                        <div className="mt-2 space-y-3">
                          {/* Quick Actions */}
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                window.open("https://meet.google.com/new", "_blank");
                                toast.success("Google Meet opened", "Copy the meeting link and paste it below");
                              }}
                            >
                              <Video className="mr-2 h-4 w-4" />
                              Create Google Meet
                            </Button>
                            {booking.calendar_event_id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const calendarUrl = `https://calendar.google.com/calendar/u/0/r/eventedit/${booking.calendar_event_id}`;
                                  window.open(calendarUrl, "_blank");
                                  toast.success("Calendar opened", "Add Google Meet to the event, then copy the link");
                                }}
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                Open Calendar Event
                              </Button>
                            )}
                          </div>

                          {/* Input Field */}
                          <Input
                            type="url"
                            placeholder="Paste the meeting link here..."
                            value={editMeetingLink}
                            onChange={(e) => setEditMeetingLink(e.target.value)}
                          />

                          {/* Save/Cancel Buttons */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={async () => {
                                if (!editMeetingLink.trim()) {
                                  toast.error("Invalid link", "Please enter a valid meeting link");
                                  return;
                                }

                                setIsUpdatingMeetingLink(true);
                                const result = await updateBooking(bookingId, {
                                  video_link: editMeetingLink.trim(),
                                });

                                if (result.success) {
                                  toast.success("Meeting link saved");
                                  setBooking({ ...booking, video_link: editMeetingLink.trim() });
                                  setIsEditingMeetingLink(false);
                                } else {
                                  toast.error("Failed to save", result.error);
                                }
                                setIsUpdatingMeetingLink(false);
                              }}
                              isLoading={isUpdatingMeetingLink}
                            >
                              Save Link
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditMeetingLink(booking.video_link || "");
                                setIsEditingMeetingLink(false);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {!isEditingMeetingLink && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingMeetingLink(true)}
                    >
                      {booking.video_link ? (
                        <>
                          <Edit2 className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Notes */}
              {booking.notes && (
                <div>
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                    Notes
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {booking.notes}
                  </p>
                </div>
              )}

              {/* Calendar Event Info */}
              {booking.calendar_event_id && (
                <div className="text-sm text-zinc-500">
                  <strong>Calendar Event ID:</strong>{" "}
                  {booking.calendar_event_id.slice(-12)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Student Info Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-5 w-5 text-zinc-500" />
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {booking.student?.full_name || "Unknown"}
                  </p>
                  <p className="text-sm text-zinc-500">Full name</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 text-zinc-500" />
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {booking.student?.email || "No email"}
                  </p>
                  <p className="text-sm text-zinc-500">Email address</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Crown className="mt-0.5 h-5 w-5 text-zinc-500" />
                <div>
                  <Badge
                    variant={
                      booking.student?.subscription_plan === "premium"
                        ? "success"
                        : "secondary"
                    }
                  >
                    {booking.student?.subscription_plan || "basic"}
                  </Badge>
                  <p className="mt-1 text-sm text-zinc-500">Subscription plan</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {booking.status === "pending" && (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={async () => {
                    const result = await updateBooking(bookingId, {
                      status: "confirmed",
                    });
                    if (result.success) {
                      toast.success("Booking confirmed", "Student will be notified.");
                      setBooking({ ...booking, status: "confirmed" });
                    } else {
                      toast.error("Failed to confirm", result.error);
                    }
                  }}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Confirm Booking
                </Button>
              )}

              {(booking.status === "pending" ||
                booking.status === "confirmed") && (
                <>
                  {booking.status === "confirmed" && (
                    <Button
                      className="w-full"
                      onClick={async () => {
                        const result = await updateBooking(bookingId, {
                          status: "completed",
                        });
                        if (result.success) {
                          toast.success("Booking completed");
                          setBooking({ ...booking, status: "completed" });
                        } else {
                          toast.error("Failed to complete", result.error);
                        }
                      }}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Mark as Completed
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel Booking
                  </Button>
                </>
              )}

              {booking.status === "cancelled" && (
                <p className="text-sm text-zinc-500 text-center py-2">
                  This booking has been cancelled
                </p>
              )}

              {booking.status === "completed" && (
                <p className="text-sm text-zinc-500 text-center py-2">
                  This booking has been completed
                </p>
              )}
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Notes</CardTitle>
              <CardDescription>
                Internal notes (not visible to student)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Add notes about this booking..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={4}
              />
              <Button
                className="w-full"
                size="sm"
                onClick={async () => {
                  setIsUpdating(true);
                  const result = await updateBooking(bookingId, {
                    notes: editNotes || null,
                  });
                  if (result.success) {
                    toast.success("Notes saved");
                    setBooking({ ...booking, notes: editNotes || null });
                  } else {
                    toast.error("Failed to save", result.error);
                  }
                  setIsUpdating(false);
                }}
                isLoading={isUpdating}
              >
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent onClose={() => setShowCancelDialog(false)}>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking? The student will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Reason for cancellation <span className="text-red-600">*</span>
            </label>
            <Textarea
              className="mt-2"
              placeholder="Provide a reason for cancelling this booking..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!cancelReason.trim()) {
                  toast.error("Reason required", "Please provide a reason for cancellation");
                  return;
                }

                setIsCancelling(true);
                const result = await updateBooking(bookingId, {
                  status: "cancelled",
                  cancellation_reason: cancelReason.trim(),
                });

                if (result.success) {
                  toast.success("Booking cancelled");
                  setBooking({ ...booking, status: "cancelled", cancellation_reason: cancelReason.trim() });
                  setShowCancelDialog(false);
                  setCancelReason("");
                } else {
                  toast.error("Failed to cancel", result.error);
                }
                setIsCancelling(false);
              }}
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
