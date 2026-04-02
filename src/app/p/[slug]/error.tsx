"use client";

import { useEffect } from "react";

export default function LandingPageError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    import("@/lib/error-logger").then(({ logError }) =>
      logError({
        message: error.message,
        stack: error.stack,
        source: "error-boundary",
        metadata: { digest: error.digest, page: "landing" },
      }),
    );
  }, [error]);
  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center text-gray-500">
      <div className="text-center">
        <p className="text-lg mb-2">Cette page n&apos;est pas disponible.</p>
        <p className="text-sm text-gray-600">
          Une erreur est survenue lors du chargement.
        </p>
      </div>
    </div>
  );
}
