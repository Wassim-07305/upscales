"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AIDocument } from "@/lib/types/database";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  Trash2,
  FileText,
  BookOpen,
  Brain,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

interface Formation {
  id: string;
  title: string;
  status: string;
}

interface AIAdminClientProps {
  documents: AIDocument[];
  formations: Formation[];
}

const STATUS_CONFIG = {
  processing: { label: "En traitement", icon: Clock, className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  ready: { label: "Prêt", icon: CheckCircle2, className: "bg-neon/20 text-neon border-neon/30" },
  error: { label: "Erreur", icon: AlertCircle, className: "bg-destructive/20 text-destructive border-destructive/30" },
};

const SOURCE_LABELS = {
  pdf: "PDF",
  txt: "Texte",
  formation: "Formation",
};

export function AIAdminClient({ documents: initialDocs, formations }: AIAdminClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState(initialDocs);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (!["pdf", "txt"].includes(ext || "")) {
          toast.error(`Format non supporté : ${ext}. Utilisez PDF ou TXT.`);
          continue;
        }

        // 1. Upload file to Supabase Storage
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", "media");

        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) throw new Error("Erreur d'upload");
        const { url } = await uploadRes.json();

        // 2. Create document record
        const docRes = await fetch("/api/ai/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: file.name.replace(/\.[^.]+$/, ""),
            source_type: ext as "pdf" | "txt",
            file_url: url,
            file_name: file.name,
          }),
        });
        if (!docRes.ok) throw new Error("Erreur de création");
        const doc = await docRes.json();

        setDocuments((prev) => [doc, ...prev]);

        // 3. Process document (embed chunks) in background
        fetch("/api/ai/documents/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId: doc.id }),
        }).then(async (res) => {
          if (res.ok) {
            const { chunk_count } = await res.json();
            setDocuments((prev) =>
              prev.map((d) =>
                d.id === doc.id ? { ...d, status: "ready" as const, chunk_count } : d
              )
            );
            toast.success(`"${doc.title}" traité (${chunk_count} chunks)`);
          } else {
            setDocuments((prev) =>
              prev.map((d) =>
                d.id === doc.id ? { ...d, status: "error" as const } : d
              )
            );
            toast.error(`Erreur de traitement pour "${doc.title}"`);
          }
        });

        toast.success(`"${file.name}" uploadé, traitement en cours...`);
      }
    } catch {
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleImportFormation() {
    if (!selectedFormation) return;
    setImporting(true);

    try {
      const res = await fetch("/api/ai/documents/import-formation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formationId: selectedFormation }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Erreur d'import");
      }

      const { chunk_count } = await res.json();
      toast.success(`Formation importée (${chunk_count} chunks)`);
      setSelectedFormation("");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur d'import";
      toast.error(message);
    } finally {
      setImporting(false);
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm("Supprimer ce document et tous ses chunks ?")) return;
    setDeletingId(docId);

    try {
      const res = await fetch(`/api/ai/documents/${docId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      toast.success("Document supprimé");
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  }

  const totalChunks = documents.reduce((sum, d) => sum + d.chunk_count, 0);
  const readyDocs = documents.filter((d) => d.status === "ready").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Brain className="h-6 w-6 text-neon" />
          Base de connaissances IA
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gérez les documents qui alimentent MateuzsIA.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="gradient-border bg-card/50">
          <CardContent className="pt-6">
            <p className="text-3xl font-display font-bold text-neon">{documents.length}</p>
            <p className="text-sm text-muted-foreground">Documents</p>
          </CardContent>
        </Card>
        <Card className="gradient-border bg-card/50">
          <CardContent className="pt-6">
            <p className="text-3xl font-display font-bold text-turquoise">{totalChunks}</p>
            <p className="text-sm text-muted-foreground">Chunks indexés</p>
          </CardContent>
        </Card>
        <Card className="gradient-border bg-card/50">
          <CardContent className="pt-6">
            <p className="text-3xl font-display font-bold">{readyDocs}</p>
            <p className="text-sm text-muted-foreground">Prêts</p>
          </CardContent>
        </Card>
      </div>

      {/* Upload & Import */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Upload PDF/TXT */}
        <Card className="gradient-border bg-card/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Uploader un document
            </CardTitle>
            <CardDescription>PDF ou fichier texte</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-neon/50 transition-colors"
            >
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-neon" />
              ) : (
                <>
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Cliquez ou glissez un fichier PDF / TXT
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </CardContent>
        </Card>

        {/* Import Formation */}
        <Card className="gradient-border bg-card/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Importer une formation
            </CardTitle>
            <CardDescription>Indexer le contenu des modules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedFormation} onValueChange={setSelectedFormation}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une formation" />
              </SelectTrigger>
              <SelectContent>
                {formations.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleImportFormation}
              disabled={!selectedFormation || importing}
              className="w-full bg-neon text-background hover:bg-neon/90"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <BookOpen className="h-4 w-4 mr-2" />
              )}
              Importer
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Documents list */}
      <Card className="gradient-border bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Documents indexés</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Brain className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucun document</p>
              <p className="text-sm mt-1">Uploadez un PDF ou importez une formation.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => {
                const statusConfig = STATUS_CONFIG[doc.status];
                const StatusIcon = statusConfig.icon;
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-[#141414] border border-border/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <StatusIcon className={cn("h-5 w-5 flex-shrink-0", statusConfig.className.split(" ")[1])} />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{doc.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {SOURCE_LABELS[doc.source_type]}
                          </Badge>
                          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", statusConfig.className)}>
                            {statusConfig.label}
                          </Badge>
                          {doc.chunk_count > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              {doc.chunk_count} chunks
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                    >
                      {deletingId === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
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
