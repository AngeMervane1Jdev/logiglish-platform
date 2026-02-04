"use client";

import { useState, useEffect } from "react";
import { getAllUsers, updateUserRole, updateUserSubscription } from "@/actions/admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Select,
  Skeleton,
  useToast,
  Input,
  Badge,
} from "@/components/ui";
import { Search, Crown, GraduationCap } from "lucide-react";
import type { Profile } from "@/types";
import { format } from "date-fns";

export default function AdminUsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchUsers = async () => {
    setIsLoading(true);
    const result = await getAllUsers({
      role: roleFilter !== "all" ? (roleFilter as "student" | "instructor" | "admin") : undefined,
      search: searchTerm || undefined,
      limit: 100,
    });

    if (result.success && result.data) {
      setUsers(result.data.users);
      setTotal(result.data.total);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
  };

  const handleRoleChange = async (userId: string, newRole: "student" | "instructor" | "admin") => {
    const result = await updateUserRole(userId, newRole);

    if (result.success) {
      toast.success("Role updated", "User role has been updated successfully.");
      fetchUsers();
    } else {
      toast.error("Update failed", result.error || "An error occurred");
    }
  };

  const handleSubscriptionChange = async (userId: string, plan: "basic" | "premium") => {
    const result = await updateUserSubscription(userId, plan);

    if (result.success) {
      toast.success("Subscription updated", "User subscription has been updated successfully.");
      fetchUsers();
    } else {
      toast.error("Update failed", result.error || "An error occurred");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Users
          </h1>
          <p className="mt-1 text-foreground-muted">
            Manage user accounts and permissions.
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <form onSubmit={handleSearch} className="flex flex-1 gap-2">
              <Input
                type="text"
                placeholder="Search by email or name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </form>
            <div className="w-48">
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="instructor">Instructors</option>
                <option value="admin">Admins</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {total} user{total !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-foreground-muted">
              No users found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left text-sm font-medium text-foreground-muted">
                      User
                    </th>
                    <th className="pb-3 text-left text-sm font-medium text-foreground-muted">
                      Role
                    </th>
                    <th className="pb-3 text-left text-sm font-medium text-foreground-muted">
                      Subscription
                    </th>
                    <th className="pb-3 text-left text-sm font-medium text-foreground-muted">
                      Joined
                    </th>
                    <th className="pb-3 text-right text-sm font-medium text-foreground-muted">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border"
                    >
                      <td className="py-4">
                        <div>
                          <div className="font-medium text-foreground">
                            {user.full_name || "No name"}
                          </div>
                          <div className="text-sm text-foreground-muted">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <Select
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(
                              user.id,
                              e.target.value as "student" | "instructor" | "admin"
                            )
                          }
                          className="w-32"
                        >
                          <option value="student">Student</option>
                          <option value="instructor">Instructor</option>
                          <option value="admin">Admin</option>
                        </Select>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <Select
                            value={user.subscription_plan}
                            onChange={(e) =>
                              handleSubscriptionChange(
                                user.id,
                                e.target.value as "basic" | "premium"
                              )
                            }
                            className="w-28"
                          >
                            <option value="basic">Basic</option>
                            <option value="premium">Premium</option>
                          </Select>
                          {user.subscription_plan === "premium" && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-sm text-foreground-muted">
                        {format(new Date(user.created_at), "MMM d, yyyy")}
                      </td>
                      <td className="py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Navigate to user's bookings
                            window.location.href = `/admin/bookings?student=${user.id}`;
                          }}
                        >
                          <GraduationCap className="mr-2 h-4 w-4" />
                          View Bookings
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
