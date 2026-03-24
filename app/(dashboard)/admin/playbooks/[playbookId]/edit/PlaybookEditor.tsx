"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  FileText,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { logSupabaseError } from "@/lib/error-logger";
import type {
  Playbook,
  PlaybookSection,
  PlaybookPage,
  SOPExternalLink,
} from "@/lib/types/database";

type SectionWithPages = PlaybookSection & { playbook_pages: PlaybookPage[] };

interface PlaybookEditorProps {
  playbook: Playbook;
  sections: SectionWithPages[];
}

export function PlaybookEditor({ playbook, sections: initialSections }: PlaybookEditorProps) {
  const router = useRouter();
  const supabase = createClient();
  const [sections, setSections] = useState<SectionWithPages[]>(initialSections);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(initialSections.map((s) => s.id))
  );

  // Section modal
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<SectionWithPages | null>(null);
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionDesc, setSectionDesc] = useState("");
  const [savingSection, setSavingSection] = useState(false);

  // Page modal
  const [pageModalOpen, setPageModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<PlaybookPage | null>(null);
  const [pageSectionId, setPageSectionId] = useState<string>("");
  const [pageTitle, setPageTitle] = useState("");
  const [pageContent, setPageContent] = useState("");
  const [pageLinks, setPageLinks] = useState<SOPExternalLink[]>([]);
  const [savingPage, setSavingPage] = useState(false);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ─── Section CRUD ──────────────────────────────────────

  const openCreateSection = () => {
    setEditingSection(null);
    setSectionTitle("");
    setSectionDesc("");
    setSectionModalOpen(true);
  };

  const openEditSection = (s: SectionWithPages) => {
    setEditingSection(s);
    setSectionTitle(s.title);
    setSectionDesc(s.description || "");
    setSectionModalOpen(true);
  };

  const saveSection = async () => {
    if (!sectionTitle.trim()) return;
    setSavingSection(true);

    if (editingSection) {
      const { error } = await supabase
        .from("playbook_sections")
        .update({ title: sectionTitle, description: sectionDesc || null })
        .eq("id", editingSection.id);

      if (error) {
        logSupabaseError("update section", error);
        toast.error("Erreur de mise à jour");
      } else {
        setSections((prev) =>
          prev.map((s) =>
            s.id === editingSection.id
              ? { ...s, title: sectionTitle, description: sectionDesc || null }
              : s
          )
        );
        toast.success("Section mise à jour");
      }
    } else {
      const { data, error } = await supabase
        .from("playbook_sections")
        .insert({
          playbook_id: playbook.id,
          title: sectionTitle,
          description: sectionDesc || null,
          order: sections.length,
        })
        .select()
        .single();

      if (error) {
        logSupabaseError("create section", error);
        toast.error("Erreur de création");
      } else {
        setSections((prev) => [...prev, { ...data, playbook_pages: [] }]);
        setExpandedSections((prev) => new Set([...prev, data.id]));
        toast.success("Section créée");
      }
    }

    setSavingSection(false);
    setSectionModalOpen(false);
  };

  const deleteSection = async (id: string) => {
    if (!confirm("Supprimer cette section et toutes ses pages ?")) return;
    const { error } = await supabase.from("playbook_sections").delete().eq("id", id);
    if (error) {
      logSupabaseError("delete section", error);
      toast.error("Erreur de suppression");
    } else {
      setSections((prev) => prev.filter((s) => s.id !== id));
      toast.success("Section supprimée");
    }
  };

  // ─── Page CRUD ─────────────────────────────────────────

  const openCreatePage = (sectionId: string) => {
    setEditingPage(null);
    setPageSectionId(sectionId);
    setPageTitle("");
    setPageContent("");
    setPageLinks([]);
    setPageModalOpen(true);
  };

  const openEditPage = (page: PlaybookPage, sectionId: string) => {
    setEditingPage(page);
    setPageSectionId(sectionId);
    setPageTitle(page.title);
    setPageContent(page.content || "");
    setPageLinks((page.external_links || []) as SOPExternalLink[]);
    setPageModalOpen(true);
  };

  const savePage = async () => {
    if (!pageTitle.trim()) return;
    setSavingPage(true);

    const section = sections.find((s) => s.id === pageSectionId);
    const payload = {
      title: pageTitle,
      content: pageContent || null,
      page_type: "content" as const,
      external_links: pageLinks.filter((l) => l.label && l.url),
    };

    if (editingPage) {
      const { error } = await supabase
        .from("playbook_pages")
        .update(payload)
        .eq("id", editingPage.id);

      if (error) {
        logSupabaseError("update page", error);
        toast.error("Erreur de mise à jour");
      } else {
        setSections((prev) =>
          prev.map((s) =>
            s.id === pageSectionId
              ? {
                  ...s,
                  playbook_pages: s.playbook_pages.map((p) =>
                    p.id === editingPage.id ? { ...p, ...payload } : p
                  ),
                }
              : s
          )
        );
        toast.success("Page mise à jour");
      }
    } else {
      const pageCount = section?.playbook_pages.length || 0;
      const { data, error } = await supabase
        .from("playbook_pages")
        .insert({
          section_id: pageSectionId,
          ...payload,
          order: pageCount,
        })
        .select()
        .single();

      if (error) {
        logSupabaseError("create page", error);
        toast.error("Erreur de création");
      } else {
        setSections((prev) =>
          prev.map((s) =>
            s.id === pageSectionId
              ? { ...s, playbook_pages: [...s.playbook_pages, data] }
              : s
          )
        );
        toast.success("Page créée");
      }
    }

    setSavingPage(false);
    setPageModalOpen(false);
  };

  const deletePage = async (pageId: string, sectionId: string) => {
    if (!confirm("Supprimer cette page ?")) return;
    const { error } = await supabase.from("playbook_pages").delete().eq("id", pageId);
    if (error) {
      logSupabaseError("delete page", error);
      toast.error("Erreur de suppression");
    } else {
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? { ...s, playbook_pages: s.playbook_pages.filter((p) => p.id !== pageId) }
            : s
        )
      );
      toast.success("Page supprimée");
    }
  };

  const addLink = () => setPageLinks((prev) => [...prev, { label: "", url: "" }]);
  const removeLink = (idx: number) => setPageLinks((prev) => prev.filter((_, i) => i !== idx));
  const updateLink = (idx: number, field: "label" | "url", value: string) => {
    setPageLinks((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

  const totalPages = sections.reduce((sum, s) => sum + s.playbook_pages.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/playbooks">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{playbook.title}</h1>
            <p className="text-sm text-muted-foreground">
              {sections.length} section{sections.length > 1 ? "s" : ""} · {totalPages} page{totalPages > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button onClick={openCreateSection} className="bg-neon text-black hover:bg-neon/90">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une section
        </Button>
      </div>

      {/* Sections */}
      {sections.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-1">Aucune section</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Commencez par créer une section (ex: Bienvenue, Formation, Ressources).
            </p>
            <Button onClick={openCreateSection} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Créer une section
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => {
            const isExpanded = expandedSections.has(section.id);
            return (
              <Card key={section.id}>
                <CardHeader
                  className="cursor-pointer select-none"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <CardTitle className="text-base">{section.title}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {section.playbook_pages.length} page{section.playbook_pages.length > 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openEditSection(section)}
                        className="p-1.5 rounded hover:bg-white/10 transition-colors"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => deleteSection(section.id)}
                        className="p-1.5 rounded hover:bg-white/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                  {section.description && (
                    <p className="text-sm text-muted-foreground mt-1 ml-6">{section.description}</p>
                  )}
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-2 ml-6">
                      {section.playbook_pages.map((page) => {
                        return (
                          <div
                            key={page.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4 text-neon shrink-0" />
                              <p className="text-sm font-medium">{page.title}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEditPage(page, section.id)}
                                className="p-1.5 rounded hover:bg-white/10 transition-colors"
                              >
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                              <button
                                onClick={() => deletePage(page.id, section.id)}
                                className="p-1.5 rounded hover:bg-white/10 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-400" />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      <button
                        onClick={() => openCreatePage(section.id)}
                        className="flex items-center gap-2 w-full p-3 rounded-lg border border-dashed border-border/50 hover:border-neon/50 text-sm text-muted-foreground hover:text-neon transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Ajouter une page
                      </button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Section Modal */}
      <Dialog open={sectionModalOpen} onOpenChange={setSectionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSection ? "Modifier la section" : "Nouvelle section"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titre</Label>
              <Input
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                placeholder="ex: Bienvenue"
              />
            </div>
            <div>
              <Label>Description (optionnelle)</Label>
              <Input
                value={sectionDesc}
                onChange={(e) => setSectionDesc(e.target.value)}
                placeholder="Description de la section..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" className="text-white hover:text-white" onClick={() => setSectionModalOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={saveSection}
                disabled={savingSection}
                className="bg-neon text-black hover:bg-neon/90"
              >
                {savingSection && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingSection ? "Enregistrer" : "Créer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Page Modal */}
      <Dialog open={pageModalOpen} onOpenChange={setPageModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPage ? "Modifier la page" : "Nouvelle page"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titre</Label>
              <Input
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                placeholder="Titre de la page"
              />
            </div>

            <div>
              <Label>Contenu</Label>
              <RichTextEditor content={pageContent} onChange={setPageContent} />
            </div>

            {/* External links */}
            <div>
              <Label>Liens externes</Label>
              <div className="space-y-2 mt-2">
                {pageLinks.map((link, idx) => (
                  <div key={idx} className="border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Lien {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeLink(idx)}
                        className="p-1 rounded hover:bg-white/10"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </button>
                    </div>
                    <Input
                      value={link.label}
                      onChange={(e) => updateLink(idx, "label", e.target.value)}
                      placeholder="Nom du lien"
                    />
                    <Input
                      value={link.url}
                      onChange={(e) => updateLink(idx, "url", e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-white"
                  onClick={addLink}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un lien
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" className="text-white hover:text-white" onClick={() => setPageModalOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={savePage}
                disabled={savingPage}
                className="bg-neon text-black hover:bg-neon/90"
              >
                {savingPage && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingPage ? "Enregistrer" : "Créer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
