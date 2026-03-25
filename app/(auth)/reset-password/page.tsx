"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle, KeyRound } from "lucide-react";

const schema = z
  .object({
    password: z.string().min(8, "Minimum 8 caractères"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm"],
  });

type ResetForm = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: ResetForm) => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      setDone(true);
      toast.success("Mot de passe mis à jour");
      setTimeout(() => router.push("/login"), 2000);
    }
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
          {done ? (
            <div className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-neon mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Mot de passe modifié !</h2>
              <p className="text-sm text-muted-foreground">
                Redirection vers la connexion...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardHeader className="pb-4">
                <h2 className="text-lg font-semibold text-center flex items-center justify-center gap-2">
                  <KeyRound className="h-5 w-5 text-neon" />
                  Nouveau mot de passe
                </h2>
                <p className="text-sm text-muted-foreground text-center">
                  Choisissez votre nouveau mot de passe
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nouveau mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                    className="bg-muted/50"
                  />
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirmer le mot de passe</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="••••••••"
                    {...register("confirm")}
                    className="bg-muted/50"
                  />
                  {errors.confirm && (
                    <p className="text-xs text-destructive">{errors.confirm.message}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Mettre à jour le mot de passe
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
