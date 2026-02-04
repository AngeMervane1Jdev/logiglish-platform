"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { checkBookingEligibility, getBookingAvailability, createBooking } from "@/actions/booking";
import {
  TimeSlotPicker,
  LessonTypeSelector,
  ActiveBookingBanner,
} from "@/components/booking";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Alert,
  AlertDescription,
  Button,
  useToast,
} from "@/components/ui";
import { useUser } from "@/hooks/use-user";
import type { LessonType, BookingEligibility } from "@/types";
import type { TimeSlot } from "@/lib/google-calendar";

export default function BookPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, profile, isLoading: userLoading } = useUser();
  const [lessonType, setLessonType] = useState<LessonType>("response_practice");
  const [eligibility, setEligibility] = useState<BookingEligibility | null>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(true);
  const [availability, setAvailability] = useState<{ date: string; slots: TimeSlot[] }[]>([]);
  const [timezone, setTimezone] = useState<string>("");
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  // Check eligibility on mount and when lesson type changes
  useEffect(() => {
    async function checkEligibility() {
      setIsCheckingEligibility(true);
      const result = await checkBookingEligibility(lessonType);
      setEligibility(result);
      setIsCheckingEligibility(false);
    }

    if (user) {
      checkEligibility();
    }
  }, [user, lessonType]);

  // Fetch availability when eligibility is confirmed
  useEffect(() => {
    let isMounted = true;

    async function fetchAvailability() {
      if (!eligibility?.canBook) return;

      setIsLoadingSlots(true);
      setSelectedSlot(null);

      const result = await getBookingAvailability(lessonType);

      if (!isMounted) return;

      if (result.success && result.data) {
        setAvailability(result.data.availability);
        setTimezone(result.data.timezone);
      } else {
        toast.error("Failed to load availability", result.error || "Please try again");
        setAvailability([]);
      }

      setIsLoadingSlots(false);
    }

    fetchAvailability();

    return () => {
      isMounted = false;
    };
  }, [eligibility?.canBook, lessonType, toast.error]);

  // Handle booking submission
  const handleBooking = async () => {
    if (!selectedSlot) return;

    setIsBooking(true);

    const result = await createBooking({
      lessonType,
      scheduledAt: selectedSlot.start.toISOString(),
    });

    if (result.success) {
      toast.success("Booking confirmed!", "You will receive a confirmation email shortly.");
      // Small delay to ensure database transaction is committed before redirect
      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push(`/bookings/${result.data?.bookingId}?success=true`);
    } else {
      toast.error("Booking failed", result.error || "Please try again");
    }

    setIsBooking(false);
  };

  if (userLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Could not load your profile. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Book a Lesson
        </h1>
        <p className="mt-1 text-foreground-muted">
          Schedule your next Response Practice session with an instructor.
        </p>
      </div>

      {/* Active Booking Banner */}
      {eligibility?.activeBooking && (
        <ActiveBookingBanner booking={eligibility.activeBooking} />
      )}

      {/* Booking Form */}
      {!eligibility?.activeBooking && (
        <>
          {/* Step 1: Select Lesson Type */}
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Choose Lesson Type</CardTitle>
              <CardDescription>
                Select the type of practice session you want to book.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LessonTypeSelector
                value={lessonType}
                onChange={(type) => {
                  setLessonType(type);
                  setSelectedSlot(null);
                }}
                subscriptionPlan={profile.subscription_plan}
                disabled={isCheckingEligibility}
              />

              {!eligibility?.canBook && eligibility?.reason && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{eligibility.reason}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Select Date/Time */}
          {eligibility?.canBook && (
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Select Date & Time</CardTitle>
                <CardDescription>
                  Choose an available time slot that works for you. Bookings must
                  be made at least 36 hours in advance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TimeSlotPicker
                  availability={availability}
                  selectedSlot={selectedSlot}
                  onSelectSlot={setSelectedSlot}
                  isLoading={isLoadingSlots}
                  timezone={timezone}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 3: Confirm Booking */}
          {selectedSlot && (
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Confirm Your Booking</CardTitle>
                <CardDescription>
                  Review your selection and confirm to book your lesson.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-background-secondary p-4">
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-foreground-muted">Lesson Type:</dt>
                        <dd className="font-medium text-foreground">
                          {lessonType === "response_practice"
                            ? "Response Practice"
                            : "Micro Response Practice"}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-foreground-muted">Date & Time:</dt>
                        <dd className="font-medium text-foreground">
                          {selectedSlot.start.toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}{" "}
                          at {selectedSlot.formatted}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-foreground-muted">Duration:</dt>
                        <dd className="font-medium text-foreground">
                          {lessonType === "response_practice" ? "30" : "15"} minutes
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <Button
                    onClick={handleBooking}
                    isLoading={isBooking}
                    className="w-full"
                    size="lg"
                  >
                    Confirm Booking
                  </Button>

                  <p className="text-center text-xs text-foreground-muted">
                    A Google Meet link will be created and sent to your email.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Booking Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-2 text-sm text-foreground-muted">
                <li>
                  You can only have one active booking at a time. Complete or
                  cancel your current booking to schedule another.
                </li>
                <li>
                  Bookings must be made at least 36 hours in advance to allow for
                  proper preparation.
                </li>
                <li>
                  Micro Response Practice sessions are only available for Premium
                  plan subscribers.
                </li>
                <li>
                  You will receive a confirmation email with a Google Meet video
                  call link after booking.
                </li>
                <li>
                  To cancel or reschedule, please do so at least 24 hours before
                  your scheduled time.
                </li>
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
