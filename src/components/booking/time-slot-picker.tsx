"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Clock, Calendar } from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import type { TimeSlot } from "@/lib/google-calendar";

interface TimeSlotPickerProps {
  availability: { date: string; slots: TimeSlot[] }[];
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  isLoading?: boolean;
  timezone?: string;
}

export function TimeSlotPicker({
  availability,
  selectedSlot,
  onSelectSlot,
  isLoading,
  timezone = "Instructor's timezone",
}: TimeSlotPickerProps) {
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-20 flex-shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      </div>
    );
  }

  if (availability.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-background-secondary p-8 text-center">
        <Calendar className="mx-auto h-12 w-12 text-foreground-muted" />
        <h3 className="mt-4 text-lg font-medium text-foreground">
          No Available Slots
        </h3>
        <p className="mt-2 text-sm text-foreground-muted">
          There are no available time slots in the next two weeks. Please check
          back later or contact support.
        </p>
      </div>
    );
  }

  const currentDay = availability[selectedDateIndex];
  const currentDate = parseISO(currentDay.date);

  const canGoPrev = selectedDateIndex > 0;
  const canGoNext = selectedDateIndex < availability.length - 1;

  return (
    <div className="space-y-6">
      {/* Date selector */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground-secondary">
            Select a Date
          </h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedDateIndex((i) => Math.max(0, i - 1))}
              disabled={!canGoPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setSelectedDateIndex((i) =>
                  Math.min(availability.length - 1, i + 1)
                )
              }
              disabled={!canGoNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {availability.map((day, index) => {
            const date = parseISO(day.date);
            const isSelected = index === selectedDateIndex;

            return (
              <button
                key={day.date}
                onClick={() => setSelectedDateIndex(index)}
                className={cn(
                  "flex flex-shrink-0 flex-col items-center rounded-lg border px-4 py-2 transition-colors",
                  isSelected
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
                )}
              >
                <span className="text-xs font-medium uppercase">
                  {format(date, "EEE")}
                </span>
                <span className="text-lg font-bold">{format(date, "d")}</span>
                <span className="text-xs">{format(date, "MMM")}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground-secondary">
            Select a Time
          </h3>
          <span className="flex items-center gap-1 text-xs text-foreground-muted">
            <Clock className="h-3 w-3" />
            {timezone}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {currentDay.slots.map((slot) => {
            const isSelected =
              selectedSlot?.start.getTime() === slot.start.getTime();

            return (
              <button
                key={slot.start.toISOString()}
                onClick={() => onSelectSlot(slot)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  isSelected
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                )}
              >
                {slot.formatted}
              </button>
            );
          })}
        </div>

        {currentDay.slots.length === 0 && (
          <p className="py-4 text-center text-sm text-foreground-muted">
            No available times for this date
          </p>
        )}
      </div>

      {/* Selected time summary */}
      {selectedSlot && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            Selected: {format(currentDate, "EEEE, MMMM d, yyyy")} at{" "}
            {selectedSlot.formatted}
          </p>
        </div>
      )}
    </div>
  );
}
