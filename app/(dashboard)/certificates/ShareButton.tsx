"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

export function ShareButton({ certificateNumber }: { certificateNumber: string }) {
  const verifyUrl = `${window.location.origin}/verify/${certificateNumber}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Certificat UPSCALE",
          text: `Vérifiez mon certificat UPSCALE : ${certificateNumber}`,
          url: verifyUrl,
        });
      } catch {
        // L'utilisateur a annulé le partage
      }
    } else {
      await navigator.clipboard.writeText(verifyUrl);
      toast.success("Lien de vérification copié !");
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleShare}>
      <Share2 className="h-4 w-4" />
    </Button>
  );
}
