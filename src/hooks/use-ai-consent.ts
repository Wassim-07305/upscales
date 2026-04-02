"use client";

import type { AiConsentScope } from "@/types/database";

/**
 * Le consentement IA est toujours actif pour tout le monde.
 * Plus besoin de toggle ni de revocation.
 */
export function useAiConsent() {
  const allScopes: AiConsentScope[] = [
    "chat_analysis",
    "risk_scoring",
    "report_generation",
    "content_suggestions",
  ];

  return {
    hasConsent: true,
    scopes: allScopes,
    consentDate: new Date().toISOString(),
    isLoading: false,
    accept: (_scopes: AiConsentScope[]) => {},
    revoke: () => {},
    isAccepting: false,
    isRevoking: false,
  };
}
