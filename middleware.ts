import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Protect everything except Next internals, static files, auth API,
  // unauthenticated integration endpoints (webhooks + cron), and the
  // public client-facing shortlist pages (/s/... + /api/public/...).
  matcher: [
    "/((?!api/auth|api/webhooks|api/cron|api/public|s/|_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|.*\\.(?:png|svg|ico|webmanifest)$).*)",
  ],
};
