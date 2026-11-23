import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase keys are not configured yet, continue without error
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const isHttps =
    process.env.NODE_ENV === "production" ||
    request.headers.get("x-forwarded-proto") === "https" ||
    request.nextUrl.protocol === "https:";

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            const isDeleting = options?.maxAge === 0 || value === "";
            const expiryDate = isDeleting
              ? new Date(0)
              : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

            supabaseResponse.cookies.set(name, value, {
              ...options,
              path: "/",
              sameSite: "lax",
              secure: isHttps,
              maxAge: isDeleting ? 0 : 365 * 24 * 60 * 60,
              expires: expiryDate,
            });
          });
        },
      },
    }
  );

  // refreshing the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Helper to ensure redirects always use https and proper host in production/reverse proxy
  const createRedirect = (targetPath: string) => {
    const url = new URL(targetPath, request.url);
    const proto = request.headers.get("x-forwarded-proto");
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");

    if (proto) {
      url.protocol = `${proto}:`;
    } else if (process.env.NODE_ENV === "production") {
      url.protocol = "https:";
    }

    if (host) {
      url.host = host;
    }

    const res = NextResponse.redirect(url, 307);
    // Preserve refreshed auth cookies across redirects with explicit 1-year expiry and Secure flag
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      res.cookies.set(cookie.name, cookie.value, {
        path: "/",
        sameSite: "lax",
        secure: isHttps,
        maxAge: 365 * 24 * 60 * 60,
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });
    });
    // Prevent iOS WebKit/Safari from aggressively caching redirects or downgrading protocols
    res.headers.set("x-middleware-cache", "no-cache");
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  };

  // Protect /home routes if logged out
  if (!user && (pathname.startsWith("/home") || pathname.startsWith("/dashboard"))) {
    return createRedirect("/login");
  }

  // If logged in, redirect /login or /signup to /home
  if (user && (pathname === "/login" || pathname === "/signup")) {
    return createRedirect("/home");
  }

  // If logged in and visiting the root landing page, auto-redirect to /home
  // (unless explicit ?landing=1 query param is provided to view marketing pitch)
  if (user && pathname === "/" && !request.nextUrl.searchParams.has("landing")) {
    return createRedirect("/home");
  }

  return supabaseResponse;
}
