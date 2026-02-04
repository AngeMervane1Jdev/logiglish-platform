import { Badge } from "@/components/ui";
import { BOOKING_STATUS_LABELS } from "@/lib/utils/constants";
import type { BookingStatus } from "@/types";

interface BookingStatusBadgeProps {
  status: BookingStatus;
}

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  const variants: Record<BookingStatus, "default" | "secondary" | "destructive" | "success" | "warning"> = {
    pending: "warning",
    confirmed: "default",
    completed: "success",
    cancelled: "destructive",
  };

  return (
    <Badge variant={variants[status]}>
      {BOOKING_STATUS_LABELS[status]}
    </Badge>
  );
}
