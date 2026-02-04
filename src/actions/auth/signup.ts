"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionResult } from "@/types";

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
});

export async function signup(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
  };

  const parsed = signupSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
    };
  }

  const { error, data } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    console.error("Signup error:", error);
    return {
      success: false,
      error: error.message,
    };
  }

  // Check if user needs email confirmation
  if (data.user && !data.session) {
    // Email confirmation is required
    console.log("User created, awaiting email confirmation:", data.user.id);
    redirect("/login?message=Please check your email to confirm your account");
  }

  // If we have a session, user is auto-confirmed (email confirmation disabled)
  if (data.user && data.session) {
    console.log("User created and auto-signed in:", data.user.id);

    // Wait a bit for the profile trigger to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verify profile was created
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Profile failed but user exists - redirect to login
      redirect("/login?message=Account created. Please sign in.");
    }

    console.log("Profile created successfully:", profile);

    // Redirect based on role
    if (profile.role === "admin") {
      redirect("/admin");
    } else if (profile.role === "instructor") {
      redirect("/instructor");
    }

    // Default: redirect to student dashboard
    redirect("/dashboard");
  }

  // Fallback
  redirect("/login");
}
