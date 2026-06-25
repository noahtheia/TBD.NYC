// Tiny logging shim — a single seam to later forward to Sentry/console without
// touching call sites.

export function logError(scope: string, error: unknown, extra?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${scope}] ${message}`, extra ?? "");
}
