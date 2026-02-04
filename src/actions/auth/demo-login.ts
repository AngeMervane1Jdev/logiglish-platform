"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/types";

// Demo account credentials - only for development
const DEMO_ACCOUNTS = {
  student: {
    email: "demo@logiglish.com",
    password: "demo123456",
    fullName: "Demo Student",
    role: "student",
    redirectTo: "/dashboard",
  },
  admin: {
    email: "admin-demo@logiglish.com",
    password: "admin123456",
    fullName: "Demo Admin",
    role: "admin",
    redirectTo: "/admin",
  },
} as const;

type DemoAccountType = keyof typeof DEMO_ACCOUNTS;

/**
 * Login with demo account for testing purposes
 * This creates the demo account if it doesn't exist
 */
export async function demoLogin(accountType: DemoAccountType = "student"): Promise<ActionResult> {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return {
      success: false,
      error: "Demo login is only available in development mode",
    };
  }

  const account = DEMO_ACCOUNTS[accountType];
  const supabase = await createClient();

  // Try to sign in first
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: account.email,
    password: account.password,
  });

  // If sign in fails, try to create the account
  if (signInError) {
    const { error: signUpError } = await supabase.auth.signUp({
      email: account.email,
      password: account.password,
      options: {
        data: {
          full_name: account.fullName,
        },
      },
    });

    if (signUpError) {
      console.error("Demo signup error:", signUpError);
      return {
        success: false,
        error: "Failed to create demo account. Make sure email confirmation is disabled in Supabase.",
      };
    }

    // Try to sign in again after creating the account
    const { error: retryError, data: signInData } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });

    if (retryError) {
      return {
        success: false,
        error: "Demo account created but couldn't sign in. Please disable email confirmation in Supabase.",
      };
    }

    // Update the role if it's an admin account
    if (account.role !== "student" && signInData.user) {
      try {
        const adminClient = createAdminClient();
        await adminClient
          .from("profiles")
          .update({ role: account.role })
          .eq("id", signInData.user.id);
      } catch (err) {
        console.error("Failed to update role:", err);
      }
    }
  } else {
    // If signing in an existing account, make sure role is set correctly
    const { data: { user } } = await supabase.auth.getUser();
    if (user && account.role !== "student") {
      try {
        const adminClient = createAdminClient();
        await adminClient
          .from("profiles")
          .update({ role: account.role })
          .eq("id", user.id);
      } catch (err) {
        console.error("Failed to update role:", err);
      }
    }
  }

  redirect(account.redirectTo);
}
