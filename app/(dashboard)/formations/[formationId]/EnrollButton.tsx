"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface EnrollButtonProps {
  formationId: string;
  isFree?: boolean;
  price?: number | null;
}

export function EnrollButton({ formationId, isFree = true, price }: EnrollButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleEnroll = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Vous devez être connecté");
      setLoading(false);
      return;
    }

    if (!isFree && price) {
      // Paid formation — redirect to Stripe Checkout
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formationId }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Erreur lors du paiement");
          setLoading(false);
          return;
        }

        if (data.url) {
          window.location.href = data.url;
          return;
        }
      } catch {
        toast.error("Erreur de connexion au service de paiement");
        setLoading(false);
        return;
      }
    } else {
      // Free formation — direct enrollment
      const { error } = await supabase.from("formation_enrollments").insert({
        user_id: user.id,
        formation_id: formationId,
      });

      if (error) {
        toast.error("Erreur lors de l'inscription", { description: error.message });
      } else {
        toast.success("Inscription réussie !");
        router.refresh();
      }
    }
    setLoading(false);
  };

  return (
    <Button onClick={handleEnroll} disabled={loading} className="w-full">
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!isFree && price ? (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Acheter la formation
        </>
      ) : (
        "S'inscrire gratuitement"
      )}
    </Button>
  );
}
