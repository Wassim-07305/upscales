"use client";

import { createBrowserClient } from "@supabase/ssr";

type ErrorSource =
  | "error-boundary"
  | "unhandled-error"
  | "unhandled-rejection"
  | "api-error"
  | "manual";

type ErrorSeverity = "warning" | "error" | "critical";

interface LogErrorOptions {
  message: string;
  stack?: string;
  componentStack?: string;
  source: ErrorSource;
  severity?: ErrorSeverity;
  metadata?: Record<string, unknown>;
}

// Deduplication: ignore same error within 5 seconds
const recentErrors = new Map<string, number>();
const DEDUP_WINDOW_MS = 5000;

function isDuplicate(message: string): boolean {
  const now = Date.now();
  const lastSeen = recentErrors.get(message);
  if (lastSeen && now - lastSeen < DEDUP_WINDOW_MS) {
    return true;
  }
  recentErrors.set(message, now);
  // Cleanup old entries
  if (recentErrors.size > 50) {
    for (const [key, time] of recentErrors) {
      if (now - time > DEDUP_WINDOW_MS) recentErrors.delete(key);
    }
  }
  return false;
}

// Noise filter patterns
const NOISE_PATTERNS = [
  /chrome-extension:\/\//,
  /moz-extension:\/\//,
  /safari-extension:\/\//,
  /ResizeObserver/,
  /Script error/,
  /NetworkError/,
  /AbortError/,
  /cancelled/i,
  /hydration/i,
  /Unexpected EOF/,
  /appendChild/,
  /Loading chunk/,
  /ChunkLoadError/,
  /NS_ERROR/,
  /out of memory/i,
];

function isNoise(message: string, stack?: string): boolean {
  const text = `${message} ${stack || ""}`;
  return NOISE_PATTERNS.some((pattern) => pattern.test(text));
}

function getSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function logError(options: LogErrorOptions): Promise<void> {
  const { message, stack, componentStack, source, severity = "error", metadata = {} } = options;

  // Skip noise and duplicates
  if (isNoise(message, stack)) return;
  if (isDuplicate(message)) return;

  try {
    const supabase = getSupabaseClient();

    // Get current user info
    const { data: { user } } = await supabase.auth.getUser();
    let userEmail: string | undefined;
    let userRole: string | undefined;

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, role")
        .eq("id", user.id)
        .single();
      if (profile) {
        userEmail = profile.email;
        userRole = profile.role;
      }
    }

    await supabase.from("error_logs").insert({
      message: message.slice(0, 2000),
      stack: stack?.slice(0, 5000),
      component_stack: componentStack?.slice(0, 5000),
      page: typeof window !== "undefined" ? window.location.pathname : undefined,
      route: typeof window !== "undefined" ? window.location.href : undefined,
      user_id: user?.id,
      user_email: userEmail,
      user_role: userRole,
      source,
      severity,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : undefined,
      viewport: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : undefined,
      metadata,
    });
  } catch {
    // Silent fail — never let error logging cause errors
  }
}

// Convenience wrappers
export function logManualError(message: string, metadata?: Record<string, unknown>) {
  return logError({ message, source: "manual", metadata });
}

export function logCriticalError(message: string, stack?: string, metadata?: Record<string, unknown>) {
  return logError({ message, stack, source: "manual", severity: "critical", metadata });
}

/**
 * Log a Supabase client-side error (caught manually in components).
 * Use this whenever you catch a Supabase error in a mutation/query.
 */
export function logSupabaseError(
  action: string,
  error: { message: string; code?: string; details?: string; hint?: string },
  metadata?: Record<string, unknown>
) {
  return logError({
    message: `[Supabase] ${action}: ${error.message}`,
    source: "api-error",
    severity: "error",
    stack: [
      `Code: ${error.code || "unknown"}`,
      error.details ? `Details: ${error.details}` : null,
      error.hint ? `Hint: ${error.hint}` : null,
    ].filter(Boolean).join("\n"),
    metadata: { ...metadata, supabaseCode: error.code, action },
  });
}
