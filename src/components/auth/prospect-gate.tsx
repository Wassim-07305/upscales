"use client";

import { Lock } from "lucide-react";
import type { ReactNode } from "react";

interface ProspectGateProps {
  /** Message affiché sur l'overlay */
  message?: string;
  /** Contenu réel — rendu flouté en arrière-plan */
  children?: ReactNode;
}

/**
 * Rend le contenu réel flouté avec un overlay "Accès réservé aux clients".
 * Les enfants sont affichés mais inaccessibles (pointer-events-none, select-none).
 */
export function ProspectGate({
  message = "Devenez client pour acceder a cette fonctionnalite",
  children,
}: ProspectGateProps) {
  return (
    <div className="relative min-h-[60vh]">
      {/* Contenu réel — flouté et non interactif */}
      <div className="pointer-events-none select-none blur-md opacity-60">
        {children}
      </div>

      {/* Overlay CTA */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center px-6 py-8 bg-surface/95 border border-border rounded-2xl shadow-lg max-w-sm backdrop-blur-sm">
          <div className="size-12 rounded-full bg-[#c6ff00]/10 flex items-center justify-center">
            <Lock className="size-5 text-[#c6ff00]" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            Acces reserve aux clients
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
