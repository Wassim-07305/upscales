"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Upscale Error]", error);
    import("@/lib/error-logger").then(({ logError }) =>
      logError({
        message: error.message,
        stack: error.stack,
        source: "error-boundary",
        severity: "critical",
        metadata: { digest: error.digest },
      })
    );
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>

        {/* Text */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-syne)]">
            Une erreur est survenue
          </h1>
          <p className="text-[#999] text-sm leading-relaxed">
            Quelque chose s&apos;est mal passé. Vous pouvez réessayer ou
            retourner à l&apos;accueil.
          </p>
          {error.digest && (
            <p className="text-xs text-[#555] font-mono">
              Code : {error.digest}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#C6FF00] text-[#0D0D0D] font-semibold text-sm hover:bg-[#d4ff33] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#333] text-[#999] text-sm hover:border-[#555] hover:text-white transition-colors"
          >
            <Home className="w-4 h-4" />
            Accueil
          </Link>
        </div>

        {/* Decorative */}
        <div className="pt-8 border-t border-[#1a1a1a]">
          <p className="text-xs text-[#444]">
            UPSCALE — Plateforme de Formation
          </p>
        </div>
      </div>
    </div>
  );
}
