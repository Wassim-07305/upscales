import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubNav } from "@/components/layout/sub-nav";
import { isModerator } from "@/lib/utils/roles";

const ROLE_LABELS: Record<string, string> = {
  setter: "Setter",
  closer: "Closer",
  coach: "Coach / CSM",
  assistante: "Assistante",
  all: "Tous les rôles",
};

const adminTabs = [
  { label: "Ressources", href: "/ressources" },
  { label: "Playbooks", href: "/admin/playbooks" },
  { label: "Pages", href: "/admin/pages" },
  { label: "Exercices", href: "/admin/exercises" },
  { label: "Contenu", href: "/admin/content" },
  { label: "SOPs", href: "/admin/sops" },
];

const memberTabs = [
  { label: "Ressources", href: "/ressources" },
  { label: "Playbooks", href: "/playbook" },
];

export default async function PlaybooksListPage() {
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

  if (!profile) redirect("/login");

  const tabs = isModerator(profile.role) ? adminTabs : memberTabs;

  const { data: playbooks } = await supabase
    .from("playbooks")
    .select("id, title, slug, description, target_role, icon")
    .eq("is_published", true)
    .order("order", { ascending: true });

  const list = playbooks || [];

  return (
    <>
    <SubNav tabs={tabs} />
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Playbooks</h1>
        <p className="text-muted-foreground">
          Guides et processus par rôle
        </p>
      </div>

      {list.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-1">Aucun playbook disponible</h3>
            <p className="text-sm text-muted-foreground">
              Les playbooks seront disponibles ici prochainement.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((pb) => (
            <Link key={pb.id} href={`/playbook/${pb.slug}`}>
              <Card className="h-full hover:border-primary/30 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-neon" />
                    <CardTitle className="text-base">{pb.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {pb.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {pb.description}
                    </p>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {ROLE_LABELS[pb.target_role] || pb.target_role}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
