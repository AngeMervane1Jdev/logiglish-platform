"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getAllBookings, updateBooking } from "@/actions/admin";
import { BookingTable } from "@/components/admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Select,
  Input,
  Skeleton,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Textarea,
  useToast,
} from "@/components/ui";
import { Search, Check, X, Trash2 } from "lucide-react";
import type { BookingWithRelations, BookingStatus } from "@/types";

export default function AdminBookingsPage() {
  const router = useRouter();
  const toast = useToast();

  // Data state
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Selection state
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set());

  // Cancel dialog state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Bulk action loading states
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const fetchBookings = async () => {
    setIsLoading(true);
    const result = await getAllBookings({
      status: statusFilter !== "all" ? (statusFilter as BookingStatus) : undefined,
      limit: 200,
    });

    if (result.success && result.data) {
      setBookings(result.data.bookings);
      setTotal(result.data.total);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  // Filter bookings by search query
  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) return bookings;

    const query = searchQuery.toLowerCase();
    return bookings.filter(booking =>
      booking.student?.full_name?.toLowerCase().includes(query) ||
      booking.student?.email?.toLowerCase().includes(query) ||
      booking.id.toLowerCase().includes(query)
    );
  }, [bookings, searchQuery]);

  const handleSelectBooking = (bookingId: string) => {
    const newSelected = new Set(selectedBookings);
    if (newSelected.has(bookingId)) {
      newSelected.delete(bookingId);
    } else {
      newSelected.add(bookingId);
    }
    setSelectedBookings(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredBookings.map(b => b.id));
      setSelectedBookings(allIds);
    } else {
      setSelectedBookings(new Set());
    }
  };

  const handleBulkConfirm = async () => {
    if (selectedBookings.size === 0) return;

    setIsConfirming(true);
    let successCount = 0;
    let errorCount = 0;

    for (const bookingId of selectedBookings) {
      const result = await updateBooking(bookingId, { status: "confirmed" });
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    setIsConfirming(false);
    setSelectedBookings(new Set());
    fetchBookings();

    if (errorCount === 0) {
      toast.success("Bookings confirmed", `${successCount} booking(s) confirmed successfully.`);
    } else {
      toast.error("Some bookings failed", `${successCount} confirmed, ${errorCount} failed.`);
    }
  };

  const handleBulkComplete = async () => {
    if (selectedBookings.size === 0) return;

    setIsCompleting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const bookingId of selectedBookings) {
      const result = await updateBooking(bookingId, { status: "completed" });
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    setIsCompleting(false);
    setSelectedBookings(new Set());
    fetchBookings();

    if (errorCount === 0) {
      toast.success("Bookings completed", `${successCount} booking(s) marked as completed.`);
    } else {
      toast.error("Some bookings failed", `${successCount} completed, ${errorCount} failed.`);
    }
  };

  const handleBulkCancel = () => {
    if (selectedBookings.size === 0) return;
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error("Reason required", "Please provide a reason for cancellation");
      return;
    }

    setIsCancelling(true);
    let successCount = 0;
    let errorCount = 0;

    for (const bookingId of selectedBookings) {
      const result = await updateBooking(bookingId, {
        status: "cancelled",
        cancellation_reason: cancelReason.trim(),
      });
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    setIsCancelling(false);
    setShowCancelDialog(false);
    setCancelReason("");
    setSelectedBookings(new Set());
    fetchBookings();

    if (errorCount === 0) {
      toast.success("Bookings cancelled", `${successCount} booking(s) cancelled successfully.`);
    } else {
      toast.error("Some bookings failed", `${successCount} cancelled, ${errorCount} failed.`);
    }
  };

  const handleConfirm = async (bookingId: string) => {
    const result = await updateBooking(bookingId, { status: "confirmed" });

    if (result.success) {
      toast.success("Booking confirmed", "Booking confirmed. Check browser console for calendar details.");
      // Refresh bookings to show updated status
      fetchBookings();
    } else {
      toast.error("Failed to confirm", result.error || "An error occurred");
    }
  };

  const handleViewDetails = (bookingId: string) => {
    router.push(`/admin/bookings/${bookingId}`);
  };

  const selectedCount = selectedBookings.size;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Bookings
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Manage all student bookings.
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  placeholder="Search by student name, email, or booking ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Status
              </label>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedCount > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {selectedCount} booking{selectedCount !== 1 ? "s" : ""} selected
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="default"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleBulkConfirm}
                  isLoading={isConfirming}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Confirm Selected
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleBulkComplete}
                  isLoading={isCompleting}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Complete Selected
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkCancel}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel Selected
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedBookings(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>
            {filteredBookings.length} of {total} booking{total !== 1 ? "s" : ""} shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <BookingTable
              bookings={filteredBookings}
              selectedBookings={selectedBookings}
              onSelectBooking={handleSelectBooking}
              onSelectAll={handleSelectAll}
              onViewDetails={handleViewDetails}
              onConfirm={handleConfirm}
            />
          )}
        </CardContent>
      </Card>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent onClose={() => setShowCancelDialog(false)}>
          <DialogHeader>
            <DialogTitle>Cancel Bookings</DialogTitle>
            <DialogDescription>
              You are about to cancel {selectedCount} booking{selectedCount !== 1 ? "s" : ""}. Students will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Reason for cancellation <span className="text-red-600">*</span>
            </label>
            <Textarea
              className="mt-2"
              placeholder="Provide a reason for cancelling these bookings..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Bookings
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
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
