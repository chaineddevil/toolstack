import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ─── Bot Shield: Bad-bot User-Agent Blocklist ────────────────────────────────
const BAD_BOT_PATTERNS = [
  "AhrefsBot", "SemrushBot", "MJ12bot", "DotBot", "BLEXBot",
  "SearchmetricsBot", "serpstatbot", "Bytespider", "PetalBot",
  "GPTBot", "CCBot", "ClaudeBot", "anthropic-ai", "Google-Extended",
  "FacebookExternalHit", "Sogou", "Baiduspider", "YandexBot",
  "DataForSeoBot", "Screaming Frog", "Rogerbot", "Exabot",
  "ZoominfoBot", "BomboraBot",
];

// ─── Rate Limiter: In-memory sliding window ──────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 60; // max requests per window
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = requestLog.get(ip) ?? [];

  // Prune old timestamps
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    return true;
  }

  recent.push(now);
  requestLog.set(ip, recent);

  // Periodic cleanup: if map gets large, prune stale entries
  if (requestLog.size > 10_000) {
    for (const [key, vals] of requestLog) {
      const filtered = vals.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
      if (filtered.length === 0) requestLog.delete(key);
      else requestLog.set(key, filtered);
    }
  }

  return false;
}

// ─── Security Headers ────────────────────────────────────────────────────────
function applySecurityHeaders(response: NextResponse, pathname: string) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  // Anti-index for admin and API routes
  if (pathname.startsWith("/api/") || pathname.startsWith("/admin")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ua = request.headers.get("user-agent") ?? "";

  // 1. Bot shield — block known bad bots
  const isBadBot = BAD_BOT_PATTERNS.some((pattern) =>
    ua.toLowerCase().includes(pattern.toLowerCase())
  );
  if (isBadBot) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  // 2. Rate limiting on API routes
  if (pathname.startsWith("/api/")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  // 3. Supabase auth session management
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4. Admin route protection
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  // 5. Redirect authenticated users away from login
  if (pathname === "/admin/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  // 6. Apply security headers to final response
  applySecurityHeaders(response, pathname);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
