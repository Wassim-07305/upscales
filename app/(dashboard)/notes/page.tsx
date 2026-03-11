import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StickyNote, BookOpen, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils/dates";
import Link from "next/link";

export default async function NotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: notes } = await supabase
    .from("module_notes")
    .select(
      "*, module:modules(id, title, order), formation:formations(id, title)"
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  // Grouper par formation
  const grouped = new Map<
    string,
    {
      formationId: string;
      formationTitle: string;
      notes: typeof notes;
    }
  >();

  notes?.forEach((note) => {
    const formation = note.formation as unknown as { id: string; title: string } | null;
    const fId = formation?.id || "unknown";
    const fTitle = formation?.title || "Formation";

    if (!grouped.has(fId)) {
      grouped.set(fId, {
        formationId: fId,
        formationTitle: fTitle,
        notes: [],
      });
    }
    grouped.get(fId)!.notes!.push(note);
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mes notes</h1>
        <p className="text-muted-foreground">
          Retrouvez toutes vos notes de cours
        </p>
      </div>

      {!notes || notes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <StickyNote className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">Aucune note pour le moment</p>
            <p className="text-sm text-muted-foreground mt-1">
              Prenez des notes pendant vos formations pour les retrouver ici
            </p>
          </CardContent>
        </Card>
      ) : (
        Array.from(grouped.values()).map((group) => (
          <Card key={group.formationId}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                {group.formationTitle}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {group.notes!.length} note{group.notes!.length > 1 ? "s" : ""}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.notes!.map((note) => {
                const module = note.module as unknown as {
                  id: string;
                  title: string;
                  order: number;
                } | null;

                return (
                  <Link
                    key={note.id}
                    href={`/formations/${group.formationId}/${module?.id || ""}`}
                    className="block p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px]">
                            Module {(module?.order ?? 0) + 1}
                          </Badge>
                          <span className="text-sm font-medium truncate">
                            {module?.title || "Module"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                          {note.content}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(note.updated_at)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
