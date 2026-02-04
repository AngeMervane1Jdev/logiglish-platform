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
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-zinc-500 dark:text-zinc-400">No bookings found.</p>
      </div>
    );
  }

  const allSelected = bookings.length > 0 && bookings.every(b => selectedBookings.has(b.id));
  const someSelected = bookings.some(b => selectedBookings.has(b.id)) && !allSelected;

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
        <thead className="bg-zinc-50 dark:bg-zinc-900">
          <tr>
            <th className="w-12 px-4 py-3">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onCheckedChange={onSelectAll}
              />
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Student
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Lesson Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Scheduled
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Status
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">
              Meeting
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Plan
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
          {bookings.map((booking) => (
            <tr key={booking.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
              <td className="w-12 px-4 py-4">
                <Checkbox
                  checked={selectedBookings.has(booking.id)}
                  onCheckedChange={() => onSelectBooking(booking.id)}
                />
              </td>
              <td className="whitespace-nowrap px-4 py-4">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {booking.student?.full_name || "Unknown"}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {booking.student?.email || "No email"}
                  </p>
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-4">
                <span className="text-sm text-zinc-900 dark:text-zinc-50">
                  {LESSON_TYPE_LABELS[booking.lesson_type]}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-4">
                <span className="text-sm text-zinc-900 dark:text-zinc-50">
                  {formatDateTime(booking.scheduled_at)}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-4">
                <BookingStatusBadge status={booking.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-center">
                {booking.video_link ? (
                  <div className="inline-flex items-center justify-center">
                    <Video className="h-4 w-4 text-green-600 dark:text-green-500" title="Meeting link added" />
                  </div>
                ) : (
                  <div className="inline-flex items-center justify-center">
                    <span className="text-zinc-400 dark:text-zinc-600" title="No meeting link">—</span>
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
