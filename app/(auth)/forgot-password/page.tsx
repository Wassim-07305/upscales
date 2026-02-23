"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";

const schema = z.object({
  email: z.string().email("Email invalide"),
});

type ForgotPasswordForm = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      toast.error("Erreur", { description: error.message });
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center mesh-gradient bg-grid p-4">
      <div className="w-full max-w-md animate-fade-up">
        <div className="text-center mb-8">
          <img src="/icons/icon-96x96.png" alt="UPSCALE" className="w-16 h-16 rounded-2xl mx-auto mb-4 animate-float" />
          <h1 className="text-3xl font-bold text-gradient">UPSCALE</h1>
        </div>

        <Card className="gradient-border bg-card/80 backdrop-blur-sm">
          {sent ? (
            <div className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-neon mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Email envoyé !</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Vérifiez votre boîte de réception pour réinitialiser votre mot de passe.
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardHeader className="pb-4">
                <h2 className="text-lg font-semibold text-center">Mot de passe oublié</h2>
                <p className="text-sm text-muted-foreground text-center">
                  Entrez votre email pour recevoir un lien de réinitialisation
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    {...register("email")}
                    className="bg-secondary/50"
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Envoyer le lien
                </Button>
                <Link href="/login" className="text-sm text-primary hover:underline">
                  <ArrowLeft className="inline mr-1 h-3 w-3" />
                  Retour à la connexion
                </Link>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
