import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config (no Prisma / Node APIs).
 * Used by middleware for route protection. The Credentials provider
 * with the DB lookup lives in auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAuthPage =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/forgot-password");

      if (isOnAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        const u = user as { id: string; role?: string; city?: string | null };
        token.id = u.id;
        token.role = u.role as never;
        token.city = u.city;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const su = session.user as {
          id: string;
          role: unknown;
          city: unknown;
        };
        su.id = token.id as string;
        su.role = token.role;
        su.city = token.city;
      }
      return session;
    },
  },
  providers: [], // added in auth.ts
} satisfies NextAuthConfig;
