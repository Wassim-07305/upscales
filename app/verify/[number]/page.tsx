import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Award } from "lucide-react";
import Link from "next/link";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const supabase = await createClient();

  const { data: certificate } = await supabase
    .from("certificates")
    .select("*, formation:formations(title), user:profiles(full_name)")
    .eq("certificate_number", number)
    .single();

  return (
    <div className="w-full max-w-lg">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-block">
          <h1 className="text-3xl font-bold tracking-[0.2em] text-primary font-display">
            UPSCALE
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Plateforme de Formation
          </p>
        </Link>
      </div>

      {certificate ? (
        <Card className="border-primary/30 bg-card/80 backdrop-blur-sm">
          <CardContent className="pt-6 text-center space-y-6">
            {/* Icône de succès */}
            <div className="flex justify-center">
              <div className="rounded-full bg-green-500/10 p-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Certificat vérifié
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Ce certificat est authentique et valide.
              </p>
            </div>

            {/* Détails du certificat */}
            <div className="space-y-4 text-left rounded-lg bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <Award className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Formation</p>
                  <p className="font-medium text-foreground">
                    {(certificate.formation as Record<string, string>)?.title ||
                      "Formation"}
                  </p>
                </div>
              </div>

              <div className="border-t border-border" />

              <div>
                <p className="text-xs text-muted-foreground">
                  Délivré à
                </p>
                <p className="font-medium text-foreground">
                  {(certificate as Record<string, Record<string, string>>).user
                    ?.full_name || "Participant"}
                </p>
              </div>

              <div className="border-t border-border" />

              <div>
                <p className="text-xs text-muted-foreground">
                  Date de délivrance
                </p>
                <p className="font-medium text-foreground">
                  {new Date(certificate.issued_at).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div className="border-t border-border" />

              <div>
                <p className="text-xs text-muted-foreground">
                  Numéro de certificat
                </p>
                <p className="font-mono text-sm text-foreground">
                  {certificate.certificate_number}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-destructive/30 bg-card/80 backdrop-blur-sm">
          <CardContent className="pt-6 text-center space-y-4">
            {/* Icône d'erreur */}
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <XCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Certificat non trouvé
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Aucun certificat ne correspond à ce numéro. Vérifiez le lien ou
                le QR code utilisé.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground mt-6">
        Vérification effectuée sur la plateforme UPSCALE
      </p>
    </div>
  );
}
