import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000"))
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function applyCors(res: NextResponse, origin: string | null) {
  const allow =
    ALLOWED_ORIGINS.includes("*") ||
    (origin && ALLOWED_ORIGINS.includes(origin));
  if (allow && origin) {
    res.headers.set("Access-Control-Allow-Origin", origin);
  } else if (ALLOWED_ORIGINS.includes("*")) {
    res.headers.set("Access-Control-Allow-Origin", "*");
  }
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,PATCH,OPTIONS"
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Api-Key, X-User-Id, X-Twilio-Signature, Stripe-Signature"
  );
  res.headers.set("Access-Control-Max-Age", "86400");
  res.headers.set("Vary", "Origin");
}

function applySecurityHeaders(res: NextResponse) {
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-XSS-Protection", "0");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(self), geolocation=(self), payment=(self)"
  );
  res.headers.set(
    "Content-Security-Policy",
    process.env.CSP_HEADER ||
      "default-src 'self'; img-src 'self' data: https: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://openrouter.ai https://api.stripe.com https://api.twilio.com; frame-src https://js.stripe.com https://hooks.stripe.com; frame-ancestors 'none'"
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin");

  const legacyAppointmentWrites = [
    "/api/booking",
    "/api/marketplace/book",
    "/api/appointments/recurring",
    "/api/voice/confirm-booking",
    "/api/voice/reschedule",
    "/api/voice/appointment-action",
    "/api/kiosk/check-in",
  ];
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_LEGACY_APPOINTMENT_WRITES !== "true" &&
    request.method !== "GET" &&
    legacyAppointmentWrites.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  ) {
    const retired = NextResponse.json(
      { error: "LEGACY_WRITE_DISABLED", message: "Use the governed /api/appointments workflow." },
      { status: 410 },
    );
    applyCors(retired, origin);
    applySecurityHeaders(retired);
    return retired;
  }

  // CORS preflight
  if (request.method === "OPTIONS" && pathname.startsWith("/api/")) {
    const res = new NextResponse(null, { status: 204 });
    applyCors(res, origin);
    applySecurityHeaders(res);
    return res;
  }

  const isAiRoute = pathname.startsWith("/api/ai/") || pathname === "/api/recovery-coach";
  if (isAiRoute) {
    if (process.env.ENABLE_AI_FEATURES !== "true" || !process.env.OPENROUTER_API_KEY) {
      const unavailable = NextResponse.json({ error: "AI_FEATURES_DISABLED", message: "AI routes require an explicitly enabled, evaluated provider configuration." }, { status: 503 });
      applyCors(unavailable, origin);
      applySecurityHeaders(unavailable);
      return unavailable;
    }
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const unauthorized = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      applyCors(unauthorized, origin);
      applySecurityHeaders(unauthorized);
      return unauthorized;
    }
  }

  const res = NextResponse.next();
  applyCors(res, origin);
  applySecurityHeaders(res);
  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
