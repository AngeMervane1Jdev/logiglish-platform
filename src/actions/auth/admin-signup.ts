"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { sendAdminAuthorizationEmail } from "@/lib/email";
import type { ActionResult } from "@/types";

// Generate a 6-digit authorization code
function generateAuthCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Schema for requesting admin signup
const requestAdminSignupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
});

// Schema for verifying admin signup
const verifyAdminSignupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  authorizationCode: z.string().length(6, "Authorization code must be 6 digits"),
});

/**
 * Step 1: Request admin account creation
 * Generates an authorization code and sends it via email (or logs to console in dev)
 * NOTE: Password is NOT stored at this step for security
 */
export async function requestAdminSignup(
  data: z.infer<typeof requestAdminSignupSchema>
): Promise<ActionResult<{ message: string }>> {
  const supabase = await createClient();
  const adminClient = createAdminClient(); // Use admin client for RLS bypass

  // Validate input
  const parsed = requestAdminSignupSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
    };
  }

  const { email, fullName } = parsed.data;

  try {
    // Check if email already exists in auth.users
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", email)
      .single();

    if (existingUser) {
      return {
        success: false,
        error: "An account with this email already exists",
      };
    }

    // Generate authorization code
    const authorizationCode = generateAuthCode();
    const codeExpiresAt = new Date();
    codeExpiresAt.setHours(codeExpiresAt.getHours() + 24); // 24 hour expiry

    // Store the pending registration (without password for security)
    // Use admin client to bypass RLS
    const { error: insertError } = await adminClient
      .from("admin_registration_requests")
      .upsert(
        {
          email,
          full_name: fullName,
          password_hash: "", // Empty - password will be provided at verification
          authorization_code: authorizationCode,
          code_expires_at: codeExpiresAt.toISOString(),
          is_verified: false,
        },
        {
          onConflict: "email",
        }
      );

    if (insertError) {
      console.error("Error storing admin registration request:", insertError);
      return {
        success: false,
        error: "Failed to process registration request",
      };
    }

    // Send authorization code via email (or log to console in dev)
    const emailResult = await sendAdminAuthorizationEmail(
      email,
      fullName,
      authorizationCode,
      codeExpiresAt
    );

    if (!emailResult.success) {
      return {
        success: false,
        error: "Failed to send authorization code. Please try again.",
      };
    }

    return {
      success: true,
      data: {
        message: process.env.NODE_ENV === "development"
          ? "Authorization code logged to console"
          : "Authorization code sent to your email",
      },
    };
  } catch (error) {
    console.error("Error in requestAdminSignup:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Step 2: Verify authorization code and complete admin account creation
 * User must provide the authorization code AND their password again
 */
export async function verifyAdminSignup(
  data: z.infer<typeof verifyAdminSignupSchema>
): Promise<ActionResult<{ message: string; redirectTo: string }>> {
  const supabase = await createClient();
  const adminClient = createAdminClient(); // Use admin client for RLS bypass

  // Validate input
  const parsed = verifyAdminSignupSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
    };
  }

  const { email, password, authorizationCode } = parsed.data;

  try {
    // Find the pending registration
    // Use admin client to bypass RLS
    const { data: registration, error: fetchError } = await adminClient
      .from("admin_registration_requests")
      .select("*")
      .eq("email", email)
      .eq("authorization_code", authorizationCode)
      .eq("is_verified", false)
      .single();

    if (fetchError || !registration) {
      return {
        success: false,
        error: "Invalid authorization code or email",
      };
    }

    // Check if code has expired
    const now = new Date();
    const expiresAt = new Date(registration.code_expires_at);
    if (now > expiresAt) {
      return {
        success: false,
        error: "Authorization code has expired. Please request a new one.",
      };
    }

    // Create the actual Supabase auth user with the provided password
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: registration.email,
      password: password,
      options: {
        data: {
          full_name: registration.full_name,
          role: "admin",
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (signUpError || !authData.user) {
      console.error("Error creating admin user:", signUpError);
      return {
        success: false,
        error: signUpError?.message || "Failed to create admin account",
      };
    }

    // Wait a bit for the profile to be created by the trigger
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Update profile with admin role using admin client to bypass RLS
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", authData.user.id);

    if (profileError) {
      console.error("Error updating profile role:", profileError);
      // Log the error but don't fail - admin can be set manually
      console.error("Admin user created but role not set. User ID:", authData.user.id);
    }

    // Mark registration as verified
    // Use admin client to bypass RLS
    await adminClient
      .from("admin_registration_requests")
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq("id", registration.id);

    // Sign in the user automatically
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: registration.email,
      password: password,
    });

    if (signInError) {
      // User was created but couldn't auto-login, redirect to login
      return {
        success: true,
        data: {
          message: "Admin account created. Please log in.",
          redirectTo: "/login",
        },
      };
    }

    return {
      success: true,
      data: {
        message: "Admin account created successfully",
        redirectTo: "/admin",
      },
    };
  } catch (error) {
    console.error("Error in verifyAdminSignup:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
