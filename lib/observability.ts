/**
 * Minimal error reporting. If SENTRY_DSN is set, POST the event to Sentry's
 * store endpoint; otherwise just console.error. Avoids pulling in the full
 * @sentry/nextjs build integration for a self-hosted deployment.
 */
function parseDsn(dsn: string) {
  // https://<publicKey>@<host>/<projectId>
  const m = /^https:\/\/([^@]+)@([^/]+)\/(.+)$/.exec(dsn.trim());
  if (!m) return null;
  return { publicKey: m[1], host: m[2], projectId: m[3] };
}

export async function captureError(
  err: unknown,
  context?: Record<string, unknown>,
) {
  const dsn = process.env.SENTRY_DSN;
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;

  console.error("[error]", message, context ?? "");

  const parsed = dsn ? parseDsn(dsn) : null;
  if (!parsed) return;

  try {
    await fetch(
      `https://${parsed.host}/api/${parsed.projectId}/store/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${parsed.publicKey}, sentry_client=primedesk-crm/1.0`,
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          platform: "node",
          level: "error",
          environment: process.env.NODE_ENV,
          message,
          exception: stack
            ? { values: [{ type: "Error", value: message, stacktrace: { frames: [] } }] }
            : undefined,
          extra: context,
        }),
      },
    );
  } catch {
    /* never let telemetry break the request */
  }
}
