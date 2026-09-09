import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Protect everything except Next internals, static files, auth API,
  // and unauthenticated integration endpoints (webhooks + cron).
  matcher: [
    "/((?!api/auth|api/webhooks|api/cron|_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|.*\\.(?:png|svg|ico|webmanifest)$).*)",
  ],
};
