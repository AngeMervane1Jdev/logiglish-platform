"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile, ActionResult } from "@/types";

interface GetAllUsersOptions {
  role?: "student" | "instructor" | "admin";
  limit?: number;
  offset?: number;
  search?: string;
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(
  options: GetAllUsersOptions = {}
): Promise<ActionResult<{ users: Profile[]; total: number }>> {
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

  // Use admin client to bypass RLS and see all users
  const adminClient = createAdminClient();

  // Build query
  let query = adminClient
    .from("profiles")
    .select("*", { count: "exact" });

  // Filter by role
  if (options.role) {
    query = query.eq("role", options.role);
  }

  // Search by email or name
  if (options.search) {
    query = query.or(
      `email.ilike.%${options.search}%,full_name.ilike.%${options.search}%`
    );
  }

  // Order by creation date
  query = query.order("created_at", { ascending: false });

  // Pagination
  if (options.limit) {
    query = query.limit(options.limit);
  }
  if (options.offset) {
    query = query.range(
      options.offset,
      options.offset + (options.limit || 10) - 1
    );
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching users:", error);
    return {
      success: false,
      error: "Failed to fetch users",
    };
  }

  return {
    success: true,
    data: {
      users: (data || []) as Profile[],
      total: count || 0,
    },
  };
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(
  userId: string,
  newRole: "student" | "instructor" | "admin"
): Promise<ActionResult> {
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

  // Use admin client to bypass RLS
  const adminClient = createAdminClient();

  // Update the user's role
  const { error } = await adminClient
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) {
    console.error("Error updating user role:", error);
    return {
      success: false,
      error: "Failed to update user role",
    };
  }

  return {
    success: true,
  };
}

/**
 * Update user subscription plan (admin only)
 */
export async function updateUserSubscription(
  userId: string,
  plan: "basic" | "premium"
): Promise<ActionResult> {
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

  // Use admin client to bypass RLS
  const adminClient = createAdminClient();

  // Update the user's subscription plan
  const { error } = await adminClient
    .from("profiles")
    .update({ subscription_plan: plan })
    .eq("id", userId);

  if (error) {
    console.error("Error updating user subscription:", error);
    return {
      success: false,
      error: "Failed to update user subscription",
    };
  }

  return {
    success: true,
  };
}
