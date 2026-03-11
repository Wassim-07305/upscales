import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Gift, Link2, CheckCircle, UserPlus } from "lucide-react";
import { formatDate } from "@/lib/utils/dates";
import { ReferralCopyButton } from "./ReferralCopyButton";

export default async function ReferralPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: referrals }] = await Promise.all([
    supabase
      .from("profiles")
      .select("referral_code")
      .eq("id", user.id)
      .single(),
    supabase
      .from("referrals")
      .select("*, referred:profiles!referrals_referred_id_fkey(full_name, avatar_url, created_at)")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const referralCode = profile?.referral_code || "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://upscales-ahmanewassim6-2668s-projects.vercel.app";
  const referralLink = `${siteUrl}/register?ref=${referralCode}`;

  const totalReferrals = referrals?.length || 0;
  const enrolledReferrals = referrals?.filter((r) => r.status === "enrolled" || r.status === "completed").length || 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Parrainage</h1>
        <p className="text-muted-foreground">
          Invitez vos amis et gagnez des récompenses
        </p>
      </div>

      {/* Referral link card */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Votre lien de parrainage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ReferralCopyButton referralLink={referralLink} referralCode={referralCode} />
          <p className="text-xs text-muted-foreground">
            Partagez ce lien avec vos amis. Quand ils s&apos;inscrivent via votre lien,
            vous recevez tous les deux des récompenses XP !
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalReferrals}</p>
                <p className="text-xs text-muted-foreground">Filleuls inscrits</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-turquoise/10">
                <CheckCircle className="h-5 w-5 text-turquoise" />
              </div>
              <div>
                <p className="text-2xl font-bold">{enrolledReferrals}</p>
                <p className="text-xs text-muted-foreground">Ont suivi une formation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rewards info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gift className="h-5 w-5 text-neon" />
            Récompenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Badge variant="secondary" className="bg-primary/20 text-primary">+100 XP</Badge>
              <span className="text-sm">Quand votre filleul s&apos;inscrit sur la plateforme</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Badge variant="secondary" className="bg-turquoise/20 text-turquoise">+250 XP</Badge>
              <span className="text-sm">Quand votre filleul s&apos;inscrit à sa première formation</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5" />
            Vos filleuls ({totalReferrals})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!referrals || referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucun filleul pour le moment. Partagez votre lien !
            </p>
          ) : (
            <div className="space-y-3">
              {referrals.map((ref) => {
                const referred = ref.referred as unknown as { full_name: string; avatar_url: string | null; created_at: string } | null;
                return (
                  <div key={ref.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{referred?.full_name || "Utilisateur"}</p>
                      <p className="text-xs text-muted-foreground">
                        Inscrit {formatDate(ref.created_at)}
                      </p>
                    </div>
                    <Badge
                      variant={ref.status === "completed" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {ref.status === "registered" && "Inscrit"}
                      {ref.status === "enrolled" && "En formation"}
                      {ref.status === "completed" && "Formation terminée"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
