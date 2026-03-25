import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText } from "lucide-react";
import { formatDate } from "@/lib/utils/dates";
import { SubNav } from "@/components/layout/sub-nav";

const parametresTabs = [
  { label: "Paramètres", href: "/admin/settings" }, { label: "Utilisateurs", href: "/admin/users" },
  { label: "Équipe", href: "/admin/team" },
  { label: "Channels", href: "/admin/channels" },
  { label: "Modération", href: "/admin/moderation" },
  { label: "Base IA", href: "/admin/ai" },
  { label: "SOPs", href: "/admin/sops" },
  { label: "Outils", href: "/admin/tools" },
  { label: "Audit", href: "/admin/audit" },
  { label: "Logs", href: "/admin/error-logs" },
  { label: "Profil", href: "/profile" },
];

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  "user.suspend": { label: "Suspension", color: "bg-destructive/20 text-destructive border-destructive/30" },
  "user.unsuspend": { label: "Réactivation", color: "bg-neon/20 text-neon border-neon/30" },
  "user.role_change": { label: "Changement rôle", color: "bg-[#FFB800]/20 text-[#FFB800] border-[#FFB800]/30" },
  "user.warning": { label: "Avertissement", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  "formation.create": { label: "Création formation", color: "bg-turquoise/20 text-turquoise border-turquoise/30" },
  "formation.update": { label: "Modification formation", color: "bg-primary/20 text-primary border-primary/30" },
  "formation.delete": { label: "Suppression formation", color: "bg-destructive/20 text-destructive border-destructive/30" },
  "post.delete": { label: "Suppression post", color: "bg-destructive/20 text-destructive border-destructive/30" },
  "post.pin": { label: "Épinglage post", color: "bg-primary/20 text-primary border-primary/30" },
  "channel.create": { label: "Création canal", color: "bg-turquoise/20 text-turquoise border-turquoise/30" },
  "channel.delete": { label: "Suppression canal", color: "bg-destructive/20 text-destructive border-destructive/30" },
  "channel.archive": { label: "Archivage canal", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  "channel.restore": { label: "Restauration canal", color: "bg-neon/20 text-neon border-neon/30" },
  "document.upload": { label: "Upload document IA", color: "bg-primary/20 text-primary border-primary/30" },
  "document.delete": { label: "Suppression document IA", color: "bg-destructive/20 text-destructive border-destructive/30" },
};

export default async function AuditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*, actor:profiles!audit_logs_actor_id_fkey(full_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <SubNav tabs={parametresTabs} />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-primary" />
          Journal d&apos;audit
        </h1>
        <p className="text-muted-foreground">Historique des actions administrateur</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Actions récentes
            {logs && (
              <Badge variant="outline" className="ml-2 text-xs">
                {logs.length} entrées
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!logs || logs.length === 0 ? (
            <div className="py-12 text-center">
              <ScrollText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">Aucune action enregistrée</p>
              <p className="text-sm text-muted-foreground mt-1">
                Les actions admin seront enregistrées ici
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log: any) => {
                const actionConfig = ACTION_LABELS[log.action] || {
                  label: log.action,
                  color: "bg-muted text-muted-foreground border-border",
                };
                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#141414] border border-border/50"
                  >
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-2 py-0.5 shrink-0 ${actionConfig.color}`}
                    >
                      {actionConfig.label}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        <span className="font-medium">
                          {log.actor?.full_name || "Système"}
                        </span>
                        {log.target_type && (
                          <span className="text-muted-foreground">
                            {" "}— {log.target_type}
                            {log.target_id && ` #${log.target_id.slice(0, 8)}`}
                          </span>
                        )}
                      </p>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {JSON.stringify(log.details)}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </>
  );
}
