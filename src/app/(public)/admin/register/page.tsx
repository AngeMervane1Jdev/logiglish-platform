"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { requestAdminSignup, verifyAdminSignup } from "@/actions/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Alert,
  AlertDescription,
} from "@/components/ui";
import { ShieldCheck, ArrowLeft } from "lucide-react";

type Step = "request" | "verify";

export default function AdminRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("request");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Step 1: Request form data
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // Step 2: Verification data
  const [authCode, setAuthCode] = useState("");

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const result = await requestAdminSignup({
      email,
      fullName,
    });

    setIsLoading(false);

    if (result.success) {
      setSuccessMessage(
        result.data?.message || "Check your email for the authorization code"
      );
      setStep("verify");
    } else {
      setError(result.error || "Failed to send authorization code");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const result = await verifyAdminSignup({
      email,
      password,
      authorizationCode: authCode,
    });

    setIsLoading(false);

    if (result.success) {
      setSuccessMessage("Admin account created successfully! Redirecting...");
      // Redirect after a brief delay to show the success message
      setTimeout(() => {
        router.push(result.data?.redirectTo || "/admin");
      }, 1000);
    } else {
      setError(result.error || "Failed to verify authorization code");
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const result = await requestAdminSignup({
      email,
      fullName,
    });

    setIsLoading(false);

    if (result.success) {
      setSuccessMessage("Code resent! Check your email for a new code.");
    } else {
      setError(result.error || "Failed to resend code");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-900">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                <ShieldCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              {step === "request" ? "Admin Registration" : "Verify Your Code"}
            </CardTitle>
            <CardDescription>
              {step === "request"
                ? "Create an admin account with authorization"
                : "Enter the authorization code sent to your email"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert variant="success" className="mb-4">
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            {step === "request" ? (
              <form onSubmit={handleRequest} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    minLength={2}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="admin@logiglish.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    Password
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={isLoading}
                  />
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Must be at least 8 characters
                  </p>
                </div>

                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Request Authorization Code
                </Button>

                <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    An authorization code will be sent to your email. In development
                    mode, the code will be displayed in the server console.
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    Authorization Code
                  </label>
                  <Input
                    type="text"
                    placeholder="123456"
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value.replace(/\D/g, ""))}
                    required
                    maxLength={6}
                    disabled={isLoading}
                    className="text-center text-2xl tracking-widest"
                  />
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Enter the 6-digit code sent to {email}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    Password
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={isLoading}
                  />
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Re-enter your password to complete registration
                  </p>
                </div>

                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Verify & Create Account
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setStep("request")}
                    className="text-blue-600 hover:underline dark:text-blue-400"
                    disabled={isLoading}
                  >
                    Change email
                  </button>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="text-blue-600 hover:underline dark:text-blue-400"
                    disabled={isLoading}
                  >
                    Resend code
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center text-sm">
              <p className="text-zinc-500 dark:text-zinc-400">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
