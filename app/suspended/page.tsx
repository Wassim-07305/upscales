import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Mail } from "lucide-react";
import { formatDate } from "@/lib/utils/dates";

export default async function SuspendedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_suspended, suspended_at, suspended_reason")
    .eq("id", user.id)
    .single();

  if (!profile?.is_suspended) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>

          <h1 className="text-xl font-bold">Compte suspendu</h1>

          <p className="text-sm text-muted-foreground">
            Votre compte a été suspendu
            {profile.suspended_at && (
              <> le {formatDate(profile.suspended_at)}</>
            )}
            .
          </p>

          {profile.suspended_reason && (
            <div className="bg-muted/30 rounded-lg p-3 text-sm text-left">
              <p className="font-medium text-xs text-muted-foreground mb-1">Motif :</p>
              <p>{profile.suspended_reason}</p>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, contactez l&apos;équipe support.
          </p>

          <div className="flex flex-col gap-2 pt-2">
            <Button variant="outline" size="sm" asChild>
              <a href="mailto:support@upscale.fr">
                <Mail className="h-4 w-4 mr-2" />
                Contacter le support
              </a>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
              <a href="/login">Se déconnecter</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
