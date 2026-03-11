"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export function PaymentToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const payment = searchParams.get("payment");

  useEffect(() => {
    if (payment === "success") {
      toast.success("Paiement confirmé !", {
        description: "Vous êtes inscrit à la formation. Bonne formation !",
        duration: 5000,
      });
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#C6FF00", "#7FFFD4", "#ffffff"],
      });
      // Nettoyer l'URL
      router.replace(window.location.pathname, { scroll: false });
    } else if (payment === "cancelled") {
      toast.error("Paiement annulé", {
        description: "Vous pouvez réessayer à tout moment.",
      });
      router.replace(window.location.pathname, { scroll: false });
    }
  }, [payment, router]);

  return null;
}
