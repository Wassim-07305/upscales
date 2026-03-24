"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  ExternalLink,
  Eye,
  EyeOff,
  Search,
  FolderOpen,
  Link2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logSupabaseError } from "@/lib/error-logger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SOP, SOPDepartment } from "@/lib/types/database";

// ─── Constants ───────────────────────────────────────────────

const DEPARTMENTS: Record<SOPDepartment, { label: string; color: string }> = {
  ceo: { label: "CEO", color: "bg-neon/20 text-neon" },
  sales: { label: "Sales", color: "bg-blue-400/20 text-blue-400" },
  delivery: { label: "Delivery", color: "bg-turquoise/20 text-turquoise" },
  publicite: { label: "Publicité", color: "bg-[#FFB800]/20 text-[#FFB800]" },
  contenu: { label: "Contenu", color: "bg-purple-400/20 text-purple-400" },
  equipe: { label: "Équipe", color: "bg-pink-400/20 text-pink-400" },
  tresorerie: { label: "Trésorerie", color: "bg-emerald-400/20 text-emerald-400" },
  operations: { label: "Opérations", color: "bg-orange-400/20 text-orange-400" },
};

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "moderator", label: "Modérateur" },
  { value: "member", label: "Membre" },
];

// ─── Schema ──────────────────────────────────────────────────

const sopSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  content: z.string().optional(),
  department: z.enum(["ceo", "sales", "delivery", "publicite", "contenu", "equipe", "tresorerie", "operations"]),
  target_roles: z.array(z.string()).min(1, "Au moins un rôle requis"),
  is_published: z.boolean(),
  links: z.array(z.object({
    label: z.string().min(1, "Label requis"),
    url: z.string().url("URL invalide"),
  })),
});
type SOPForm = z.infer<typeof sopSchema>;

// ─── Component ───────────────────────────────────────────────

interface SOPsAdminClientProps {
  sops: SOP[];
}

export function SOPsAdminClient({ sops }: SOPsAdminClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; sop?: SOP }>({ open: false });
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<"all" | SOPDepartment>("all");

  const filtered = sops.filter((s) => {
    if (deptFilter !== "all" && s.department !== deptFilter) return false;
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const groupedByDept = filtered.reduce<Record<string, SOP[]>>((acc, sop) => {
    if (!acc[sop.department]) acc[sop.department] = [];
    acc[sop.department].push(sop);
    return acc;
  }, {});

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette SOP ?")) return;
    setLoading(true);
    const { error } = await supabase.from("sops").delete().eq("id", id);
    if (error) { logSupabaseError("sops.delete", error); toast.error(error.message || "Erreur"); }
    else { toast.success("SOP supprimée"); router.refresh(); }
    setLoading(false);
  };

  const handleTogglePublish = async (sop: SOP) => {
    const { error } = await supabase.from("sops").update({ is_published: !sop.is_published }).eq("id", sop.id);
    if (error) { logSupabaseError("sops.togglePublish", error); toast.error(error.message || "Erreur"); }
    else { toast.success(sop.is_published ? "SOP dépubliée" : "SOP publiée"); router.refresh(); }
  };

  // Empty state
  if (sops.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">SOPs</h1>
            <p className="text-muted-foreground">Procédures opérationnelles standard</p>
          </div>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-1">Aucune SOP</h3>
            <p className="text-sm text-muted-foreground mb-4">Créez votre première procédure opérationnelle.</p>
            <Button onClick={() => setModal({ open: true })} className="bg-neon text-black hover:bg-neon/90">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle SOP
            </Button>
          </CardContent>
        </Card>
        <SOPFormModal open={modal.open} onClose={() => setModal({ open: false })} supabase={supabase} onSuccess={() => { setModal({ open: false }); router.refresh(); }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SOPs</h1>
          <p className="text-muted-foreground">Procédures opérationnelles standard — {sops.length} procédure{sops.length > 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setModal({ open: true })} className="bg-neon text-black hover:bg-neon/90">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle SOP
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une SOP..." className="pl-9" />
        </div>
        <Tabs value={deptFilter} onValueChange={(v) => setDeptFilter(v as typeof deptFilter)}>
          <TabsList className="h-9 flex-wrap">
            <TabsTrigger value="all" className="text-xs px-2.5">Tous</TabsTrigger>
            {Object.entries(DEPARTMENTS).map(([key, dept]) => {
              const count = sops.filter((s) => s.department === key).length;
              if (count === 0) return null;
              return (
                <TabsTrigger key={key} value={key} className="text-xs px-2.5">
                  {dept.label} ({count})
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Grouped SOPs */}
      {Object.entries(groupedByDept).map(([dept, deptSops]) => {
        const deptConfig = DEPARTMENTS[dept as SOPDepartment];
        return (
          <div key={dept} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-xs", deptConfig.color)}>{deptConfig.label}</Badge>
              <span className="text-xs text-muted-foreground">{deptSops.length} SOP{deptSops.length > 1 ? "s" : ""}</span>
            </div>
            {deptSops.map((sop) => (
              <Card key={sop.id} className={cn(!sop.is_published && "opacity-60 border-dashed")}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                      <CardTitle className="text-sm truncate">{sop.title}</CardTitle>
                      {!sop.is_published && <Badge variant="outline" className="text-[10px] shrink-0">Brouillon</Badge>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleTogglePublish(sop)}>
                        {sop.is_published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setModal({ open: true, sop })}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-300" onClick={() => handleDelete(sop.id)} disabled={loading}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {sop.content && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{sop.content.replace(/<[^>]*>/g, "").slice(0, 200)}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {sop.target_roles.map((r) => (
                      <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>
                    ))}
                    {(sop.external_links as { label: string; url: string }[])?.length > 0 && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Link2 className="h-3 w-3" />
                        {(sop.external_links as { label: string; url: string }[]).length} lien{(sop.external_links as { label: string; url: string }[]).length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      })}

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Aucune SOP trouvée.</p>
      )}

      <SOPFormModal
        open={modal.open}
        sop={modal.sop}
        onClose={() => setModal({ open: false })}
        supabase={supabase}
        onSuccess={() => { setModal({ open: false }); router.refresh(); }}
      />
    </div>
  );
}

// ─── Form Modal ──────────────────────────────────────────────

function SOPFormModal({
  open,
  sop,
  onClose,
  supabase,
  onSuccess,
}: {
  open: boolean;
  sop?: SOP;
  onClose: () => void;
  supabase: ReturnType<typeof createClient>;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const form = useForm<SOPForm>({
    resolver: zodResolver(sopSchema),
    values: sop
      ? {
          title: sop.title,
          content: sop.content || "",
          department: sop.department,
          target_roles: sop.target_roles,
          is_published: sop.is_published,
          links: (sop.external_links as { label: string; url: string }[]) || [],
        }
      : {
          title: "",
          content: "",
          department: "ceo",
          target_roles: ["admin"],
          is_published: false,
          links: [],
        },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "links" });

  const toggleRole = (role: string) => {
    const current = form.getValues("target_roles");
    if (current.includes(role)) {
      if (current.length > 1) form.setValue("target_roles", current.filter((r) => r !== role));
    } else {
      form.setValue("target_roles", [...current, role]);
    }
  };

  const onSubmit = async (data: SOPForm) => {
    setLoading(true);
    const payload = {
      title: data.title,
      content: data.content || null,
      department: data.department,
      target_roles: data.target_roles,
      is_published: data.is_published,
      external_links: data.links,
    };

    if (sop) {
      const { error } = await supabase.from("sops").update(payload).eq("id", sop.id);
      if (error) { logSupabaseError("sops.update", error); toast.error(error.message || "Erreur"); setLoading(false); return; }
      toast.success("SOP mise à jour");
    } else {
      const { error } = await supabase.from("sops").insert(payload);
      if (error) { logSupabaseError("sops.create", error); toast.error(error.message || "Erreur"); setLoading(false); return; }
      toast.success("SOP créée");
    }
    setLoading(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{sop ? "Modifier la SOP" : "Nouvelle SOP"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Titre</Label>
            <Input {...form.register("title")} placeholder="Ex: Processus de relance client silencieux" />
            {form.formState.errors.title && <p className="text-xs text-red-400 mt-1">{form.formState.errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Département</Label>
              <Select value={form.watch("department")} onValueChange={(v) => form.setValue("department", v as SOPDepartment)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DEPARTMENTS).map(([key, dept]) => (
                    <SelectItem key={key} value={key}>{dept.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Publié</Label>
              <div className="flex items-center gap-2 mt-2">
                <Switch checked={form.watch("is_published")} onCheckedChange={(v) => form.setValue("is_published", v)} />
                <span className="text-sm text-muted-foreground">{form.watch("is_published") ? "Visible" : "Brouillon"}</span>
              </div>
            </div>
          </div>

          <div>
            <Label>Rôles cibles</Label>
            <div className="flex gap-2 mt-1">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={cn(
                    "h-8 rounded-md px-3 text-sm font-medium border transition-colors",
                    form.watch("target_roles").includes(opt.value)
                      ? "bg-neon text-black border-neon hover:bg-neon/90"
                      : "bg-transparent text-white border-border hover:bg-white/10"
                  )}
                  onClick={() => toggleRole(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {form.formState.errors.target_roles && <p className="text-xs text-red-400 mt-1">{form.formState.errors.target_roles.message}</p>}
          </div>

          <div>
            <Label>Contenu</Label>
            <Textarea {...form.register("content")} placeholder="Décrivez la procédure étape par étape..." rows={8} />
          </div>

          {/* External links */}
          <div>
            <Label>Liens externes</Label>
            <div className="space-y-2 mt-1">
              {fields.map((field, idx) => (
                <div key={field.id} className="space-y-2 rounded-lg border border-border/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Lien {idx + 1}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-300" onClick={() => remove(idx)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Input {...form.register(`links.${idx}.label`)} placeholder="Nom du lien (ex: Script DM)" />
                  <Input {...form.register(`links.${idx}.url`)} placeholder="https://docs.google.com/..." />
                </div>
              ))}
              <Button type="button" variant="ghost" size="sm" className="text-white hover:text-white" onClick={() => append({ label: "", url: "" })}>
                <Plus className="h-3 w-3 mr-1" />
                Ajouter un lien
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" className="text-white hover:text-white" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={loading} className="bg-neon text-black hover:bg-neon/90">
              {loading ? "..." : sop ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
