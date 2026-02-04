import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_ROUTES = ["/dashboard", "/book", "/bookings", "/messages", "/topics"];

// Routes that require admin role
const ADMIN_ROUTES = ["/admin"];

// Routes that require instructor role
const INSTRUCTOR_ROUTES = ["/instructor"];

// Routes that should redirect to dashboard if already authenticated
const AUTH_ROUTES = ["/login", "/signup"];

// Public routes that should bypass authentication (even if they match protected patterns)
const PUBLIC_ROUTES = ["/admin/register", "/auth/clear"];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;

  // Check if route is public (should bypass authentication)
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // Skip authentication checks for public routes
  if (isPublicRoute) {
    return supabaseResponse;
  }

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // If there's a refresh token error, redirect to clear auth page
  if (authError && authError.message?.includes("refresh_token_not_found")) {
    return NextResponse.redirect(new URL("/auth/clear", request.url));
  }

  // Check if route requires authentication
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
  const isInstructorRoute = INSTRUCTOR_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Get user profile for role-based routing
  let userRole: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    userRole = profile?.role || null;
  }

  // Redirect authenticated users away from auth pages to their appropriate dashboard
  if (isAuthRoute && user) {
    if (userRole === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    } else if (userRole === "instructor") {
      return NextResponse.redirect(new URL("/instructor", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect admins from student dashboard to admin dashboard
  if (pathname === "/dashboard" && userRole === "admin") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Redirect instructors from student dashboard to instructor dashboard
  if (pathname === "/dashboard" && userRole === "instructor") {
    return NextResponse.redirect(new URL("/instructor", request.url));
  }

  // Redirect unauthenticated users to login
  if ((isProtectedRoute || isAdminRoute || isInstructorRoute) && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Check role-based access for admin routes
  if (isAdminRoute && user) {
    if (userRole !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Check role-based access for instructor routes
  if (isInstructorRoute && user) {
    if (userRole !== "instructor" && userRole !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
