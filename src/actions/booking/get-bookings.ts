"use server";

import { createClient } from "@/lib/supabase/server";
import type { Booking, BookingStatus, ActionResult } from "@/types";

interface GetBookingsOptions {
  status?: BookingStatus | BookingStatus[];
  limit?: number;
  orderBy?: "scheduled_at" | "created_at";
  ascending?: boolean;
}

/**
 * Get bookings for the current user
 */
export async function getBookings(
  options: GetBookingsOptions = {}
): Promise<ActionResult<Booking[]>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be logged in to view bookings",
    };
  }

  let query = supabase
    .from("bookings")
    .select("*")
    .eq("student_id", user.id);

  // Filter by status
  if (options.status) {
    if (Array.isArray(options.status)) {
      query = query.in("status", options.status);
    } else {
      query = query.eq("status", options.status);
    }
  }

  // Order
  const orderColumn = options.orderBy || "scheduled_at";
  const ascending = options.ascending ?? false;
  query = query.order(orderColumn, { ascending });

  // Limit
  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching bookings:", error);
    return {
      success: false,
      error: "Failed to fetch bookings",
    };
  }

  return {
    success: true,
    data: (data || []) as Booking[],
  };
}

/**
 * Get a single booking by ID
 */
export async function getBookingById(
  bookingId: string
): Promise<ActionResult<Booking>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be logged in to view this booking",
    };
  }

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("student_id", user.id)
    .single();

  if (error) {
    console.error("Error fetching booking:", error);
    return {
      success: false,
      error: "Booking not found",
    };
  }

  return {
    success: true,
    data: data as Booking,
  };
}

/**
 * Get active booking (pending or confirmed) for current user
 */
export async function getActiveBooking(): Promise<ActionResult<Booking | null>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be logged in",
    };
  }

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("student_id", user.id)
    .in("status", ["pending", "confirmed"])
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching active booking:", error);
    return {
      success: false,
      error: "Failed to fetch booking",
    };
  }

  return {
    success: true,
    data: data ? (data as Booking) : null,
  };
}
