"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

/**
 * Utility page to clear authentication state
 * Useful after database purges or when getting refresh token errors
 */
export default function ClearAuthPage() {
  const [status, setStatus] = useState<"clearing" | "success" | "error">("clearing");
  const router = useRouter();

  useEffect(() => {
    async function clearAuth() {
      try {
        const supabase = createClient();

        // Sign out (clears cookies)
        await supabase.auth.signOut();

        // Clear localStorage
        if (typeof window !== "undefined") {
          localStorage.clear();
          sessionStorage.clear();
        }

        setStatus("success");

        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } catch (error) {
        console.error("Error clearing auth:", error);
        setStatus("error");
      }
    }

    clearAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        {status === "clearing" && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900">
              Clearing authentication state...
            </h2>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Auth state cleared successfully!
            </h2>
            <p className="text-gray-600">
              Redirecting to login page...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">✗</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Error clearing auth state
            </h2>
            <p className="text-gray-600 mb-4">
              Please manually clear your browser cookies and localStorage
            </p>
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
