"use client";

import { useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { logError } from "@/lib/error-logger";

const NOISE_PATTERNS = [
  /chrome-extension:\/\//,
  /moz-extension:\/\//,
  /safari-extension:\/\//,
  /ResizeObserver/,
  /Script error\.?$/,
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

function isNoise(message: string): boolean {
  return NOISE_PATTERNS.some((p) => p.test(message));
}

export function ErrorMonitoringProvider({ children }: { children: React.ReactNode }) {
  const originalFetch = useRef<typeof fetch | null>(null);

  const handleError = useCallback(
    (message: string, source: "unhandled-error" | "unhandled-rejection" | "api-error", stack?: string) => {
      if (isNoise(message)) return;
      toast.error("Erreur détectée", {
        description: message.slice(0, 120),
        duration: 4000,
      });
      logError({ message, stack, source });
    },
    []
  );

  useEffect(() => {
    // 1. window.onerror — uncaught JS errors
    const onError = (event: ErrorEvent) => {
      const msg = event.message || "Unknown error";
      const stack = event.error?.stack;
      handleError(msg, "unhandled-error", stack);
    };

    // 2. Unhandled promise rejections
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "Unhandled promise rejection";
      const stack = reason instanceof Error ? reason.stack : undefined;
      handleError(msg, "unhandled-rejection", stack);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    // 3. Fetch interceptor for 5xx errors + Supabase PostgREST errors (4xx)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

    if (!originalFetch.current) {
      originalFetch.current = window.fetch.bind(window);
      window.fetch = async (...args: Parameters<typeof fetch>) => {
        const response = await originalFetch.current!.call(window, ...args);
        const url = typeof args[0] === "string" ? args[0] : args[0] instanceof URL ? args[0].toString() : (args[0] as Request).url;

        if (response.status >= 500) {
          handleError(
            `API ${response.status}: ${url}`,
            "api-error",
            `Status: ${response.status} ${response.statusText}\nURL: ${url}`
          );
        }

        // Capture Supabase PostgREST errors (400-level from supabase rest API)
        if (
          response.status >= 400 &&
          response.status < 500 &&
          supabaseUrl &&
          url.includes(supabaseUrl) &&
          url.includes("/rest/")
        ) {
          // Clone response to read body without consuming it
          const cloned = response.clone();
          try {
            const body = await cloned.json();
            if (body?.message || body?.error) {
              const msg = body.message || body.error || `Supabase ${response.status}`;
              // Don't log auth-related 4xx (normal flow)
              if (!url.includes("/auth/")) {
                logError({
                  message: msg,
                  source: "api-error",
                  severity: "warning",
                  stack: `Status: ${response.status}\nURL: ${url}\nCode: ${body.code || "unknown"}\nDetails: ${body.details || body.hint || ""}`,
                  metadata: { code: body.code, hint: body.hint, details: body.details },
                });
              }
            }
          } catch {
            // Body not JSON — ignore
          }
        }

        return response;
      };
    }

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      if (originalFetch.current) {
        window.fetch = originalFetch.current;
        originalFetch.current = null;
      }
    };
  }, [handleError]);

  return <>{children}</>;
}
