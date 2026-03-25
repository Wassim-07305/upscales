"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Loader2 } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

type LoginForm = z.infer<typeof loginSchema>;

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 60_000; // 60 seconds

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockCountdown, setLockCountdown] = useState(0);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const supabase = createClient();
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // Countdown timer for lockout
  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        setLockCountdown(0);
      } else {
        setLockCountdown(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    if (isLocked) {
      toast.error(`Trop de tentatives. Réessayez dans ${lockCountdown}s`);
      return;
    }

    // if (turnstileSiteKey && !captchaToken) {
    //   toast.error("Veuillez valider le captcha");
    //   return;
    // }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        const lockTime = Date.now() + LOCKOUT_DURATION;
        setLockedUntil(lockTime);
        setLockCountdown(Math.ceil(LOCKOUT_DURATION / 1000));
        toast.error("Compte temporairement verrouillé", {
          description: `Trop de tentatives échouées. Réessayez dans ${Math.ceil(LOCKOUT_DURATION / 1000)}s`,
        });
      } else {
        toast.error("Erreur de connexion", {
          description: error.message === "Invalid login credentials"
            ? `Email ou mot de passe incorrect (${MAX_ATTEMPTS - newAttempts} tentative(s) restante(s))`
            : error.message,
        });
      }
      setLoading(false);
      return;
    }

    setAttempts(0);
    toast.success("Connexion réussie");
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center mesh-gradient bg-grid p-4">
      <div className="w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/icons/icon-96x96.png" alt="UPSCALE" className="w-16 h-16 rounded-2xl mx-auto mb-4 animate-float" />
          <h1 className="text-3xl font-bold text-gradient">UPSCALE</h1>
          <p className="text-muted-foreground mt-2">Connectez-vous à votre espace</p>
        </div>

        <Card className="gradient-border bg-card/80 backdrop-blur-sm">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader className="pb-4">
              <h2 className="text-lg font-semibold text-center">Connexion</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  {...register("email")}
                  className="bg-muted/50"
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
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
            </CardContent>
            <CardFooter className="flex-col gap-4 pt-4">
              {/* Turnstile captcha disabled
              {turnstileSiteKey && (
                <div className="w-full">
                  <Turnstile
                    siteKey={turnstileSiteKey}
                    onSuccess={setCaptchaToken}
                    onError={() => setCaptchaToken(null)}
                    onExpire={() => setCaptchaToken(null)}
                    options={{ theme: "dark", size: "flexible" }}
                  />
                </div>
              )}
              */}
              {isLocked && (
                <div className="text-center text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  Trop de tentatives. Réessayez dans {lockCountdown}s
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading || isLocked}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLocked ? `Verrouillé (${lockCountdown}s)` : "Se connecter"}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                Pas encore de compte ?{" "}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Créer un compte
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
