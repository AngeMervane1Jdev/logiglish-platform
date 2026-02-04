"use client";

import Link from "next/link";
import { Eye, Check, X, Video } from "lucide-react";
import { Button, Badge, Checkbox } from "@/components/ui";
import { BookingStatusBadge } from "@/components/booking";
import { formatDateTime } from "@/lib/utils/date";
import { LESSON_TYPE_LABELS } from "@/lib/utils/constants";
import type { BookingWithRelations } from "@/types";

interface BookingTableProps {
  bookings: BookingWithRelations[];
  selectedBookings: Set<string>;
  onSelectBooking: (bookingId: string) => void;
  onSelectAll: (checked: boolean) => void;
  onViewDetails: (bookingId: string) => void;
  onConfirm?: (bookingId: string) => void;
  onStatusChange?: (bookingId: string, status: "completed" | "cancelled") => void;
}

export function BookingTable({
  bookings,
  selectedBookings,
  onSelectBooking,
  onSelectAll,
  onViewDetails,
  onConfirm,
  onStatusChange
}: BookingTableProps) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-background p-8 text-center">
        <p className="text-foreground-muted">No bookings found.</p>
      </div>
    );
  }

  const allSelected = bookings.length > 0 && bookings.every(b => selectedBookings.has(b.id));
  const someSelected = bookings.some(b => selectedBookings.has(b.id)) && !allSelected;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-background-secondary">
          <tr>
            <th className="w-12 px-4 py-3">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onCheckedChange={onSelectAll}
              />
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground-muted">
              Student
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground-muted">
              Lesson Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground-muted">
              Scheduled
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground-muted">
              Status
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-foreground-muted">
              Meeting
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground-muted">
              Plan
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-foreground-muted">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-background">
          {bookings.map((booking) => (
            <tr key={booking.id} className="hover:bg-accent">
              <td className="w-12 px-4 py-4">
                <Checkbox
                  checked={selectedBookings.has(booking.id)}
                  onCheckedChange={() => onSelectBooking(booking.id)}
                />
              </td>
              <td className="whitespace-nowrap px-4 py-4">
                <div>
                  <p className="font-medium text-foreground">
                    {booking.student?.full_name || "Unknown"}
                  </p>
                  <p className="text-sm text-foreground-muted">
                    {booking.student?.email || "No email"}
                  </p>
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-4">
                <span className="text-sm text-foreground">
                  {LESSON_TYPE_LABELS[booking.lesson_type]}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-4">
                <span className="text-sm text-foreground">
                  {formatDateTime(booking.scheduled_at)}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-4">
                <BookingStatusBadge status={booking.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-center">
                {booking.video_link ? (
                  <div className="inline-flex items-center justify-center">
                    <span title="Meeting link added"><Video className="h-4 w-4 text-green-600 dark:text-green-500" /></span>
                  </div>
                ) : (
                  <div className="inline-flex items-center justify-center">
                    <span className="text-foreground-muted" title="No meeting link">—</span>
                  </div>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-4">
                <Badge
                  variant={
                    booking.student?.subscription_plan === "premium"
                      ? "success"
                      : "secondary"
                  }
                >
                  {booking.student?.subscription_plan || "basic"}
                </Badge>
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  {booking.status === "pending" && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => onConfirm?.(booking.id)}
                      title="Confirm booking"
                    >
                      Confirm
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/bookings/${booking.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  {booking.status === "confirmed" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onStatusChange?.(booking.id, "completed")}
                      title="Mark as completed"
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                  )}
                  {(booking.status === "pending" || booking.status === "confirmed") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onStatusChange?.(booking.id, "cancelled")}
                      title="Cancel booking"
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
