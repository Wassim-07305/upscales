"use client";

import { usePathname } from "next/navigation";
import { RoleLayout } from "@/components/layout/role-layout";
import { ProspectGate } from "@/components/auth/prospect-gate";
import { useAuth } from "@/hooks/use-auth";

/** Routes where prospect has FULL access (no blur) */
const PROSPECT_ALLOWED_ROUTES = [
  "/client/dashboard",
  "/client/feed",
  "/client/community",
  "/client/ai",
  "/client/suivi",
  "/client/documents",
  "/client/contracts",
  "/client/invoices",
  "/client/settings",
  "/client/notifications",
  "/client/challenges",
  "/client/pipeline",
  "/client/closer-calls",
];

/** Custom messages per restricted route */
const PROSPECT_MESSAGES: Record<string, string> = {
  "/client/school":
    "Acces aux formations complet reserve aux clients. Rejoignez le programme pour apprendre et progresser.",
  "/client/messaging":
    "La messagerie avec votre coach est disponible des votre inscription. Devenez client pour echanger en direct.",
  "/client/progression":
    "Le systeme de progression (XP, badges, classement) est reserve aux clients actifs.",
  "/client/journal":
    "Le journal et le suivi hebdomadaire sont reserves aux clients actifs.",
  "/client/booking":
    "La reservation de sessions est disponible des votre inscription comme client.",
  "/client/resources":
    "L'acces complet aux ressources est reserve aux clients du programme.",
  "/client/leaderboard":
    "Le classement et les competitions sont reserves aux clients actifs.",
};

function isAllowedForProspect(pathname: string): boolean {
  return PROSPECT_ALLOWED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

function getProspectMessage(pathname: string): string {
  for (const [route, msg] of Object.entries(PROSPECT_MESSAGES)) {
    if (pathname === route || pathname.startsWith(route + "/")) return msg;
  }
  return "Cette fonctionnalite est reservee aux clients du programme.";
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = useAuth();
  const pathname = usePathname();
  const isProspect = profile?.role === "prospect";
  const variant = isProspect ? "prospect" : "client";

  // Prospect sur route restreinte → afficher le contenu réel flouté
  if (isProspect && !isAllowedForProspect(pathname)) {
    return (
      <RoleLayout variant={variant}>
        <ProspectGate message={getProspectMessage(pathname)}>
          {children}
        </ProspectGate>
      </RoleLayout>
    );
  }

  return <RoleLayout variant={variant}>{children}</RoleLayout>;
}
