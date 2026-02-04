"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { login, demoLogin } from "@/actions/auth";
import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Alert, AlertDescription, Skeleton } from "@/components/ui";

function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoadingType, setDemoLoadingType] = useState<"student" | "admin" | null>(null);
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    const result = await login(formData);

    if (!result.success) {
      setError(result.error || "An error occurred");
      setIsLoading(false);
    }
  }

  async function handleDemoLogin(accountType: "student" | "admin") {
    setDemoLoadingType(accountType);
    setError(null);

    const result = await demoLogin(accountType);

    if (!result.success) {
      setError(result.error || "Demo login failed");
      setDemoLoadingType(null);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your Logiglish account</CardDescription>
      </CardHeader>
      <CardContent>
        {message && (
          <Alert variant="success" className="mb-4">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign in
          </Button>
        </form>

        {/* Demo Login - Development Only */}
        {process.env.NODE_ENV !== "production" && (
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-center text-foreground-muted mb-3">
              Development Mode
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => handleDemoLogin("student")}
                isLoading={demoLoadingType === "student"}
                disabled={demoLoadingType !== null}
              >
                Demo Student
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => handleDemoLogin("admin")}
                isLoading={demoLoadingType === "admin"}
                disabled={demoLoadingType !== null}
              >
                Demo Admin
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-foreground-muted">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-foreground underline underline-offset-4 hover:no-underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

function LoginFormSkeleton() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Skeleton className="h-8 w-40 mx-auto mb-2" />
        <Skeleton className="h-4 w-56 mx-auto" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </CardContent>
      <CardFooter className="justify-center">
        <Skeleton className="h-4 w-48" />
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-secondary px-4">
      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
