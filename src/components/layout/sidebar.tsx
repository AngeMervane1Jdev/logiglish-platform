"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  MessageSquare,
  Users,
  Settings,
  FileText,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import type { UserRole } from "@/types";

interface SidebarProps {
  role: UserRole;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

const studentNav: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Book a Lesson", href: "/book", icon: Calendar },
  { name: "My Bookings", href: "/bookings", icon: BookOpen },
  { name: "Topics", href: "/topics", icon: FileText },
  { name: "Messages", href: "/messages", icon: MessageSquare },
];

const adminNav: NavItem[] = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Bookings", href: "/admin/bookings", icon: Calendar },
  { name: "Topics", href: "/admin/topics", icon: FileText },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Messages", href: "/admin/messages", icon: MessageSquare },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

const instructorNav: NavItem[] = [
  { name: "Dashboard", href: "/instructor", icon: LayoutDashboard },
  { name: "My Schedule", href: "/instructor/schedule", icon: Calendar },
  { name: "Students", href: "/instructor/students", icon: Users },
  { name: "Messages", href: "/instructor/messages", icon: MessageSquare },
];

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const getNavigation = () => {
    switch (role) {
      case "admin":
        return adminNav;
      case "instructor":
        return instructorNav;
      default:
        return studentNav;
    }
  };

  const navigation = getNavigation();

  const isActive = (href: string) => {
    if (href === "/dashboard" || href === "/admin" || href === "/instructor") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
          <Link href="/dashboard" className="text-xl font-bold text-sidebar-foreground">
            Logiglish
          </Link>
          <ThemeToggle />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-sidebar-active text-sidebar-foreground"
                    : "text-foreground-muted hover:bg-sidebar-active hover:text-sidebar-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-foreground-muted">
            Logiglish Platform v1.0
          </p>
        </div>
      </div>
    </aside>
  );
}
