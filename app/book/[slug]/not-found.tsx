import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mesh-gradient bg-grid min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-6 animate-fade-up">
        <div className="inline-flex items-center justify-center size-20 rounded-2xl bg-[#141414] border border-[#2A2A2A] mb-2">
          <span className="text-4xl font-display font-bold text-muted-foreground">
            404
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Page introuvable
          </h1>
          <p className="text-muted-foreground mt-2">
            Ce lien de réservation n&apos;existe pas ou a été désactivé.
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Retour à l&apos;accueil
          </Link>
        </Button>
      </div>
    </div>
  );
}
