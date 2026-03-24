import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Link2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CATEGORIES: Record<string, { label: string; color: string }> = {
  vente: { label: "Vente", color: "bg-blue-400/20 text-blue-400" },
  ads: { label: "Publicité", color: "bg-orange-400/20 text-orange-400" },
  delivery: { label: "Delivery", color: "bg-turquoise/20 text-turquoise" },
  operations: { label: "Opérations", color: "bg-pink-400/20 text-pink-400" },
  contenu: { label: "Contenu", color: "bg-purple-400/20 text-purple-400" },
  finance: { label: "Finance", color: "bg-emerald-400/20 text-emerald-400" },
  autre: { label: "Autre", color: "bg-zinc-400/20 text-zinc-400" },
};

export default async function ToolsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: tools } = await supabase
    .from("tool_links")
    .select("*")
    .eq("is_published", true)
    .order("category")
    .order("order", { ascending: true });

  const list = tools || [];

  const grouped = list.reduce<Record<string, typeof list>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Liens & Outils</h1>
        <p className="text-muted-foreground">Accès rapide aux outils de l'équipe</p>
      </div>

      {list.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Link2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-1">Aucun lien disponible</h3>
            <p className="text-sm text-muted-foreground">Les liens seront disponibles ici prochainement.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([cat, catTools]) => {
          const catConfig = CATEGORIES[cat] || CATEGORIES.autre;
          return (
            <div key={cat} className="space-y-3">
              <Badge variant="outline" className={cn("text-xs", catConfig.color)}>{catConfig.label}</Badge>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {catTools.map((tool) => (
                  <a
                    key={tool.id}
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Card className="hover:border-neon/30 transition-colors h-full">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          {tool.title}
                          <ExternalLink className="h-3 w-3 text-neon shrink-0" />
                        </div>
                        {tool.description && (
                          <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
