"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BookingWithRelations, BookingStatus, ActionResult } from "@/types";

interface GetAllBookingsOptions {
  status?: BookingStatus | BookingStatus[];
  limit?: number;
  offset?: number;
  orderBy?: "scheduled_at" | "created_at";
  ascending?: boolean;
  search?: string;
}

/**
 * Get all bookings (admin only)
 */
export async function getAllBookings(
  options: GetAllBookingsOptions = {}
): Promise<ActionResult<{ bookings: BookingWithRelations[]; total: number }>> {
  const supabase = await createClient();

  // Verify admin role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return {
      success: false,
      error: "Unauthorized - Admin access required",
    };
  }

  // Use admin client to bypass RLS and see all bookings
  const adminClient = createAdminClient();

  // Build query
  let query = adminClient.from("bookings").select(
    `
      *,
      student:profiles!bookings_student_id_fkey(*),
      instructor:profiles!bookings_instructor_id_fkey(*),
      topic:topics(*)
    `,
    { count: "exact" }
  );

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

  // Pagination
  if (options.limit) {
    query = query.limit(options.limit);
  }
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching bookings:", error);
    return {
      success: false,
      error: "Failed to fetch bookings",
    };
  }

  return {
    success: true,
    data: {
      bookings: (data || []) as BookingWithRelations[],
      total: count || 0,
    },
  };
}
