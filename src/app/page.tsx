import Link from "next/link";
import { ArrowRight, Calendar, BookOpen, MessageSquare, Video } from "lucide-react";
import { Button } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <span className="text-xl font-bold text-foreground">
            Logiglish
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm font-medium text-foreground-muted hover:text-foreground"
            >
              Sign in
            </Link>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Master English with{" "}
            <span className="text-primary">
              Real-Time Practice
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-foreground-muted">
            Logiglish helps you improve your English speaking skills through
            structured lessons, real-time response practice, and personalized
            feedback from expert instructors.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start Learning
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-background-secondary">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">
              How It Works
            </h2>
            <p className="mt-4 text-foreground-muted">
              Our structured approach helps you build confidence and fluency.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-card-foreground">
                Pre-Study Materials
              </h3>
              <p className="mt-2 text-sm text-foreground-muted">
                Prepare with structured exercises and materials before each
                lesson.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success-background">
                <Calendar className="h-6 w-6 text-success" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-card-foreground">
                Easy Booking
              </h3>
              <p className="mt-2 text-sm text-foreground-muted">
                Schedule lessons at your convenience with our integrated booking
                system.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Video className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-card-foreground">
                Live Practice
              </h3>
              <p className="mt-2 text-sm text-foreground-muted">
                Practice real-time responses with expert instructors via video
                chat.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning-background">
                <MessageSquare className="h-6 w-6 text-warning" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-card-foreground">
                Personalized Feedback
              </h3>
              <p className="mt-2 text-sm text-foreground-muted">
                Receive detailed feedback on your writing and speaking to
                accelerate learning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-zinc-900 px-8 py-16 text-center dark:bg-zinc-100">
          <h2 className="text-3xl font-bold text-white dark:text-zinc-900">
            Ready to improve your English?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-300 dark:text-zinc-600">
            Join Logiglish today and start your journey to English fluency with
            our proven methodology.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-8"
            asChild
          >
            <Link href="/signup">Create Free Account</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-foreground-muted">
            &copy; {new Date().getFullYear()} Logiglish. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
