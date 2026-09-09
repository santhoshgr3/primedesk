import { z } from "zod";

/**
 * Validated environment. Import from here instead of reading process.env
 * directly so a missing/invalid value fails fast at boot, not mid-request.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),

  // Auth — accept either the v4 or v5 name.
  NEXTAUTH_SECRET: z.string().min(16).optional(),
  AUTH_SECRET: z.string().min(16).optional(),
  NEXTAUTH_URL: z.string().url().optional(),

  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("PrimeDesk CRM"),

  REDIS_URL: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  ALLOW_SEED: z.string().optional(),

  // Integrations — all optional; features degrade to no-op without them.
  WHATSAPP_API_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  META_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:\n",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error("Invalid environment — see errors above");
}

const data = parsed.data;

if (!data.NEXTAUTH_SECRET && !data.AUTH_SECRET) {
  throw new Error("Set NEXTAUTH_SECRET (or AUTH_SECRET) — min 16 chars");
}

export const env = {
  ...data,
  authSecret: (data.AUTH_SECRET ?? data.NEXTAUTH_SECRET)!,
  isProd: data.NODE_ENV === "production",
  hasWhatsApp: !!data.WHATSAPP_API_TOKEN && !!data.WHATSAPP_PHONE_NUMBER_ID,
  hasEmail: !!data.RESEND_API_KEY,
};
