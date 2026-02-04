import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Calendar, Users, MessageSquare, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get stats
  const [
    { count: totalBookings },
    { count: pendingBookings },
    { count: completedBookings },
    { count: totalUsers },
    { count: unreadMessages },
  ] = await Promise.all([
    supabase.from("bookings").select("*", { count: "exact", head: true }),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "confirmed"]),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("messages").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    {
      name: "Total Bookings",
      value: totalBookings || 0,
      icon: Calendar,
      description: "All time",
    },
    {
      name: "Active Bookings",
      value: pendingBookings || 0,
      icon: Calendar,
      description: "Pending & Confirmed",
    },
    {
      name: "Completed Lessons",
      value: completedBookings || 0,
      icon: CheckCircle,
      description: "Successfully completed",
    },
    {
      name: "Total Users",
      value: totalUsers || 0,
      icon: Users,
      description: "Registered users",
    },
    {
      name: "Messages",
      value: unreadMessages || 0,
      icon: MessageSquare,
      description: "Total messages",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-foreground-muted">
          Overview of your platform activity and metrics.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                <Icon className="h-4 w-4 text-foreground-muted" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-foreground-muted">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href="/admin/bookings"
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
            >
              <Calendar className="h-8 w-8 text-foreground-muted" />
              <div>
                <p className="font-medium text-foreground">
                  Manage Bookings
                </p>
                <p className="text-sm text-foreground-muted">View and edit bookings</p>
              </div>
            </a>
            <a
              href="/admin/messages"
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
            >
              <MessageSquare className="h-8 w-8 text-foreground-muted" />
              <div>
                <p className="font-medium text-foreground">
                  Messages
                </p>
                <p className="text-sm text-foreground-muted">View student messages</p>
              </div>
            </a>
            <a
              href="/admin/users"
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
            >
              <Users className="h-8 w-8 text-foreground-muted" />
              <div>
                <p className="font-medium text-foreground">
                  Users
                </p>
                <p className="text-sm text-foreground-muted">Manage user accounts</p>
              </div>
            </a>
            <a
              href="/admin/topics"
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
            >
              <CheckCircle className="h-8 w-8 text-foreground-muted" />
              <div>
                <p className="font-medium text-foreground">
                  Topics
                </p>
                <p className="text-sm text-foreground-muted">Manage learning topics</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
