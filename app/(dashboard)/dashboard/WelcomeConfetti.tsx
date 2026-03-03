"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";

export function WelcomeConfetti() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isWelcome = searchParams.get("welcome") === "1";

  useEffect(() => {
    if (!isWelcome) return;

    // Petit délai pour que la page soit visible
    const timer = setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ["#C6FF00", "#7FFFD4", "#ffffff", "#a3e635"],
      });

      // Nettoyer l'URL sans recharger
      router.replace("/dashboard", { scroll: false });
    }, 300);

    return () => clearTimeout(timer);
  }, [isWelcome, router]);

  return null;
}
