import { Search, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* 404 Badge */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#C6FF00]/20 bg-[#C6FF00]/5">
            <Search className="w-4 h-4 text-[#C6FF00]" />
            <span className="text-sm font-mono text-[#C6FF00]">404</span>
          </div>

          <h1 className="text-4xl font-bold text-white font-[family-name:var(--font-syne)]">
            Page introuvable
          </h1>
          <p className="text-[#999] text-sm leading-relaxed">
            La page que vous recherchez n&apos;existe pas ou a été déplacée.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#C6FF00] text-[#0D0D0D] font-semibold text-sm hover:bg-[#d4ff33] transition-colors"
          >
            <Home className="w-4 h-4" />
            Accueil
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#333] text-[#999] text-sm hover:border-[#555] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
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
