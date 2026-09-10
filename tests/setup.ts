// Ensure lib/env.ts validation passes when a test imports a module that
// transitively imports lib/prisma.
process.env.DATABASE_URL ||= "postgresql://test:test@localhost:5432/test";
process.env.DIRECT_URL ||= process.env.DATABASE_URL;
process.env.AUTH_SECRET ||= "test-secret-at-least-16-chars-long";
process.env.NEXT_PUBLIC_APP_URL ||= "http://localhost:3000";
