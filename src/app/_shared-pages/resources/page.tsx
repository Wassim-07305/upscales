"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  useResources,
  useResourceFolders,
  useCreateFolder,
  useDeleteFolder,
  useUploadResource,
  useUpdateResource,
  useDeleteResource,
  useTrackDownload,
  useMoveResourceToFolder,
} from "@/hooks/use-resources";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  staggerContainer,
  staggerItem,
  fadeInUp,
  defaultTransition,
} from "@/lib/animations";
import { FolderCard } from "@/components/resources/folder-card";
import { FolderFormModal } from "@/components/resources/folder-form-modal";
import { FolderPermissionsModal } from "@/components/resources/folder-permissions-modal";
import {
  FolderOpen,
  FolderPlus,
  Upload,
  Search,
  FileText,
  FileImage,
  FileVideo,
  FileSpreadsheet,
  File,
  Download,
  Trash2,
  Pin,
  PinOff,
  Eye,
  Users,
  Lock,
  X,
  Loader2,
  MoreVertical,
  ChevronRight,
  ArrowLeft,
  FolderInput,
  LayoutGrid,
  List,
} from "lucide-react";
import type { Resource, ResourceFolder } from "@/types/database";

// ─── Constantes ────────────────────────────

const VISIBILITY_OPTIONS = [
  { value: "all" as const, label: "Tout le monde", icon: Eye },
  { value: "staff" as const, label: "Staff uniquement", icon: Lock },
  { value: "clients" as const, label: "Clients", icon: Users },
];

const FILE_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  image: { bg: "bg-purple-500/10", color: "text-purple-600" },
  video: { bg: "bg-blue-500/10", color: "text-blue-600" },
  spreadsheet: { bg: "bg-emerald-500/10", color: "text-emerald-600" },
  document: { bg: "bg-[#c6ff00]/10", color: "text-[#c6ff00]" },
  default: { bg: "bg-gray-500/10", color: "text-gray-600" },
};

// ─── Helpers ───────────────────────────────

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return FileImage;
  if (type.startsWith("video/")) return FileVideo;
  if (
    type.includes("spreadsheet") ||
    type.includes("csv") ||
    type.includes("excel")
  )
    return FileSpreadsheet;
  if (
    type.includes("pdf") ||
    type.includes("document") ||
    type.includes("text")
  )
    return FileText;
  return File;
}

function getFileTypeColor(type: string) {
  if (type.startsWith("image/")) return FILE_TYPE_COLORS.image;
  if (type.startsWith("video/")) return FILE_TYPE_COLORS.video;
  if (
    type.includes("spreadsheet") ||
    type.includes("csv") ||
    type.includes("excel")
  )
    return FILE_TYPE_COLORS.spreadsheet;
  if (
    type.includes("pdf") ||
    type.includes("document") ||
    type.includes("text")
  )
    return FILE_TYPE_COLORS.document;
  return FILE_TYPE_COLORS.default;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

// ─── Page ──────────────────────────────────

export default function ResourcesPage() {
  const { isStaff } = useAuth();

  // Vue : null = racine, string = id du dossier
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modals
  const [showUpload, setShowUpload] = useState(false);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [permissionsFolder, setPermissionsFolder] =
    useState<ResourceFolder | null>(null);

  // Menu contextuel fichier
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [moveMenuOpen, setMoveMenuOpen] = useState<string | null>(null);

  // Recherche
  const [search, setSearch] = useState("");

  // Donnees
  const { data: resources, isLoading: isLoadingResources } =
    useResources(selectedFolderId);
  const { data: folders, isLoading: isLoadingFolders } = useResourceFolders();
  const uploadResource = useUploadResource();
  const updateResource = useUpdateResource();
  const deleteResource = useDeleteResource();
  const trackDownload = useTrackDownload();
  const createFolder = useCreateFolder();
  const deleteFolder = useDeleteFolder();
  const moveResource = useMoveResourceToFolder();

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadVisibility, setUploadVisibility] = useState<
    "all" | "staff" | "clients"
  >("all");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dossier selectionne
  const selectedFolder = useMemo(
    () => folders?.find((f) => f.id === selectedFolderId) ?? null,
    [folders, selectedFolderId],
  );

  // Filtrage par recherche
  const filtered = useMemo(() => {
    if (!resources) return [];
    if (!search.trim()) return resources;
    const q = search.trim().toLowerCase();
    return resources.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.file_name.toLowerCase().includes(q),
    );
  }, [resources, search]);

  // ─── Upload ──────────────────────────────

  const resetUpload = useCallback(() => {
    setUploadFile(null);
    setUploadTitle("");
    setUploadVisibility("all");
    setShowUpload(false);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!uploadFile || !uploadTitle.trim()) return;
    await uploadResource.mutateAsync({
      file: uploadFile,
      title: uploadTitle.trim(),
      visibility: uploadVisibility,
      folderId: selectedFolderId,
    });
    resetUpload();
  }, [
    uploadFile,
    uploadTitle,
    uploadVisibility,
    selectedFolderId,
    uploadResource,
    resetUpload,
  ]);

  const handleFileDrop = useCallback(
    (file: File) => {
      if (file.size > 50 * 1024 * 1024) return;
      setUploadFile(file);
      if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^.]+$/, ""));
      setShowUpload(true);
    },
    [uploadTitle],
  );

  const handleDownload = useCallback(
    (resource: Pick<Resource, "id" | "file_url" | "file_name">) => {
      trackDownload.mutate(resource.id);
      const a = document.createElement("a");
      a.href = resource.file_url;
      a.download = resource.file_name;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
    },
    [trackDownload],
  );

  // ─── Rendu ───────────────────────────────

  const isLoading = isLoadingResources || isLoadingFolders;
  const isRoot = selectedFolderId === null;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ═══ Header ═══ */}
      <motion.div
        variants={fadeInUp}
        transition={defaultTransition}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          {isRoot ? (
            <>
              <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">
                Ressources
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Bibliotheque de documents et fichiers partages
              </p>
            </>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <button
                  onClick={() => {
                    setSelectedFolderId(null);
                    setSearch("");
                  }}
                  className="hover:text-foreground transition-colors"
                >
                  Ressources
                </button>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-foreground font-medium">
                  {selectedFolder?.name ?? "Dossier"}
                </span>
              </div>
              <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">
                {selectedFolder?.name ?? "Dossier"}
              </h1>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isRoot && (
            <button
              onClick={() => {
                setSelectedFolderId(null);
                setSearch("");
              }}
              className="h-9 px-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          )}
          {isStaff && isRoot && (
            <button
              onClick={() => setShowFolderForm(true)}
              className="h-9 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              Nouveau dossier
            </button>
          )}
          {isStaff && (
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#c6ff00] to-[#c6ff00] text-white text-sm font-medium hover:shadow-lg hover:shadow-[#c6ff00]/25 transition-all active:scale-[0.98] flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Ajouter un fichier
            </button>
          )}
        </div>
      </motion.div>

      {/* ═══ Upload form ═══ */}
      {showUpload && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-surface rounded-2xl p-6 space-y-4 border border-border"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Nouveau fichier
              {selectedFolder && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  dans {selectedFolder.name}
                </span>
              )}
            </h2>
            <button
              onClick={resetUpload}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const f = e.dataTransfer.files[0];
              if (f) handleFileDrop(f);
            }}
            className={cn(
              "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
              isDragging
                ? "border-[#c6ff00]/50 bg-[#c6ff00]/10"
                : uploadFile
                  ? "border-[#c6ff00]/30 bg-[#c6ff00]/5"
                  : "border-border hover:border-[#c6ff00]/30 hover:bg-muted/30",
            )}
          >
            {uploadFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-5 h-5 text-[#c6ff00]" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">
                    {uploadFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(uploadFile.size)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadFile(null);
                  }}
                  className="ml-2 text-muted-foreground hover:text-error"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Clique ou glisse un fichier ici
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  PDF, images, documents, videos — max 50 Mo
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileDrop(f);
              }}
              className="hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Titre
              </label>
              <input
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Nom du fichier"
                className="w-full h-9 px-3 bg-muted border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#c6ff00]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Visibilite
              </label>
              <div className="flex gap-2">
                {VISIBILITY_OPTIONS.map((v) => (
                  <button
                    key={v.value}
                    onClick={() => setUploadVisibility(v.value)}
                    className={cn(
                      "h-9 px-3 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5",
                      uploadVisibility === v.value
                        ? "bg-gradient-to-r from-[#c6ff00] to-[#c6ff00] text-white"
                        : "bg-muted text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <v.icon className="w-3 h-3" />
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={
              uploadResource.isPending || !uploadFile || !uploadTitle.trim()
            }
            className="h-9 px-4 bg-gradient-to-r from-[#c6ff00] to-[#c6ff00] text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-[#c6ff00]/25 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {uploadResource.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            {uploadResource.isPending ? "Upload..." : "Ajouter"}
          </button>
        </motion.div>
      )}

      {/* ═══ Barre de recherche + toggle vue ═══ */}
      <motion.div
        variants={fadeInUp}
        transition={defaultTransition}
        className="flex items-center justify-between gap-3"
      >
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#c6ff00]/20 transition-shadow"
          />
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 shrink-0">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === "grid"
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            title="Vue grille"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === "list"
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            title="Vue liste"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* ═══ Contenu (dossiers + fichiers) ═══ */}
      <motion.div variants={fadeInUp} transition={defaultTransition}>
        {isLoadingResources || (isRoot && isLoadingFolders) ? (
          <div
            className={cn(
              "gap-3",
              viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                : "space-y-2",
            )}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "bg-surface rounded-2xl animate-shimmer",
                  viewMode === "grid" ? "h-32" : "h-16",
                )}
                style={{ boxShadow: "var(--shadow-card)" }}
              />
            ))}
          </div>
        ) : (
          <>
            {/* Grille / Liste */}
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
                  : "space-y-2",
              )}
            >
              {/* Dossiers (vue racine, pas de recherche) */}
              {isRoot &&
                !search.trim() &&
                folders?.map((folder) =>
                  viewMode === "grid" ? (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      onClick={() => {
                        setSelectedFolderId(folder.id);
                        setSearch("");
                      }}
                      isStaff={isStaff}
                      onDelete={(id) => {
                        if (
                          window.confirm(
                            "Supprimer ce dossier ? Les fichiers seront deplaces a la racine.",
                          )
                        ) {
                          deleteFolder.mutate(id);
                        }
                      }}
                      onPermissions={(f) => setPermissionsFolder(f)}
                    />
                  ) : (
                    <div
                      key={folder.id}
                      onClick={() => {
                        setSelectedFolderId(folder.id);
                        setSearch("");
                      }}
                      className="bg-surface rounded-2xl p-4 hover:shadow-md hover:-translate-y-px transition-all duration-200 cursor-pointer group border border-transparent hover:border-border flex items-center gap-4"
                      style={{ boxShadow: "var(--shadow-card)" }}
                    >
                      <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                        <FolderOpen className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {folder.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {folder.file_count ?? 0} fichier
                          {(folder.file_count ?? 0) !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  ),
                )}

              {/* Fichiers */}
              {filtered.map((resource) => {
                const IconComponent = getFileIcon(resource.file_type);
                const fileColors = getFileTypeColor(resource.file_type);
                const date = new Date(resource.created_at).toLocaleDateString(
                  "fr-FR",
                  { day: "numeric", month: "short", year: "numeric" },
                );

                return viewMode === "grid" ? (
                  /* ── Vue grille : carte carrée ── */
                  <div
                    key={resource.id}
                    className="bg-surface rounded-2xl p-4 hover:shadow-md hover:-translate-y-px transition-all duration-200 group border border-transparent hover:border-border relative"
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <div
                        className={cn(
                          "w-14 h-14 rounded-xl flex items-center justify-center",
                          fileColors.bg,
                        )}
                      >
                        <IconComponent
                          className={cn("w-7 h-7", fileColors.color)}
                        />
                      </div>
                      <div className="w-full min-w-0">
                        <h3 className="text-xs font-semibold text-foreground truncate">
                          {resource.title}
                        </h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatFileSize(resource.file_size)}
                        </p>
                      </div>
                      {resource.is_pinned && (
                        <Pin className="w-3 h-3 text-amber-500 absolute top-2 right-2" />
                      )}
                      {resource.visibility === "staff" && (
                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 absolute top-2 left-2">
                          Staff
                        </span>
                      )}
                    </div>
                    {/* Actions au hover */}
                    <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleDownload(resource)}
                        className="h-8 px-3 rounded-xl text-xs font-medium bg-[#c6ff00] text-white hover:bg-[#c6ff00]/90 transition-colors flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Telecharger
                      </button>
                      {isStaff && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(
                              menuOpen === resource.id ? null : resource.id,
                            );
                          }}
                          className="h-8 w-8 rounded-xl bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-foreground" />
                        </button>
                      )}
                    </div>
                    {/* Menu contextuel */}
                    {isStaff && menuOpen === resource.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => {
                            setMenuOpen(null);
                            setMoveMenuOpen(null);
                          }}
                        />
                        <div className="absolute right-0 top-full mt-1 z-50 bg-surface border border-border rounded-xl shadow-lg py-1 w-48">
                          <button
                            onClick={() => {
                              updateResource.mutate({
                                id: resource.id,
                                is_pinned: !resource.is_pinned,
                              });
                              setMenuOpen(null);
                            }}
                            className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
                          >
                            {resource.is_pinned ? (
                              <>
                                <PinOff className="w-3.5 h-3.5" />
                                Desepingler
                              </>
                            ) : (
                              <>
                                <Pin className="w-3.5 h-3.5" />
                                Epingler
                              </>
                            )}
                          </button>
                          <div className="relative">
                            <button
                              onClick={() =>
                                setMoveMenuOpen(
                                  moveMenuOpen === resource.id
                                    ? null
                                    : resource.id,
                                )
                              }
                              className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
                            >
                              <FolderInput className="w-3.5 h-3.5" />
                              Deplacer
                            </button>
                            {moveMenuOpen === resource.id && (
                              <div className="absolute left-full top-0 ml-1 bg-surface border border-border rounded-xl shadow-lg py-1 w-44 max-h-48 overflow-y-auto">
                                {resource.folder_id && (
                                  <button
                                    onClick={() => {
                                      moveResource.mutate({
                                        resourceId: resource.id,
                                        folderId: null,
                                      });
                                      setMenuOpen(null);
                                      setMoveMenuOpen(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-muted transition-colors"
                                  >
                                    Hors dossier
                                  </button>
                                )}
                                {folders
                                  ?.filter((f) => f.id !== resource.folder_id)
                                  .map((f) => (
                                    <button
                                      key={f.id}
                                      onClick={() => {
                                        moveResource.mutate({
                                          resourceId: resource.id,
                                          folderId: f.id,
                                        });
                                        setMenuOpen(null);
                                        setMoveMenuOpen(null);
                                      }}
                                      className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-muted transition-colors truncate"
                                    >
                                      {f.icon ?? "📁"} {f.name}
                                    </button>
                                  ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              if (
                                window.confirm("Supprimer cette ressource ?")
                              ) {
                                deleteResource.mutate({
                                  id: resource.id,
                                  file_url: resource.file_url,
                                });
                              }
                              setMenuOpen(null);
                            }}
                            className="w-full px-3 py-2 text-left text-xs text-error hover:bg-error/5 flex items-center gap-2 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Supprimer
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  /* ── Vue liste : ligne ── */
                  <div
                    key={resource.id}
                    className="bg-surface rounded-2xl p-4 hover:shadow-md hover:-translate-y-px transition-all duration-200 group border border-transparent hover:border-border"
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                          fileColors.bg,
                        )}
                      >
                        <IconComponent
                          className={cn("w-5 h-5", fileColors.color)}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground truncate">
                            {resource.title}
                          </h3>
                          {resource.is_pinned && (
                            <Pin className="w-3 h-3 text-amber-500 shrink-0" />
                          )}
                          {resource.visibility === "staff" && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 shrink-0">
                              Staff
                            </span>
                          )}
                          {resource.visibility === "clients" && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20 shrink-0">
                              Clients
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{formatFileSize(resource.file_size)}</span>
                          <span aria-hidden="true">&middot;</span>
                          <span>{date}</span>
                          {resource.download_count > 0 && (
                            <>
                              <span aria-hidden="true">&middot;</span>
                              <span>
                                {resource.download_count} telechargement
                                {resource.download_count > 1 ? "s" : ""}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleDownload(resource)}
                          className="h-8 px-3 rounded-xl text-xs font-medium text-[#c6ff00] border border-[#c6ff00]/20 hover:bg-[#c6ff00]/5 hover:border-[#c6ff00]/40 transition-colors flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Telecharger</span>
                        </button>
                        {isStaff && (
                          <div className="relative">
                            <button
                              onClick={() =>
                                setMenuOpen(
                                  menuOpen === resource.id ? null : resource.id,
                                )
                              }
                              className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors md:opacity-0 md:group-hover:opacity-100"
                            >
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </button>
                            {menuOpen === resource.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={() => {
                                    setMenuOpen(null);
                                    setMoveMenuOpen(null);
                                  }}
                                />
                                <div className="absolute right-0 top-full mt-1 z-50 bg-surface border border-border rounded-xl shadow-lg py-1 w-48">
                                  <button
                                    onClick={() => {
                                      updateResource.mutate({
                                        id: resource.id,
                                        is_pinned: !resource.is_pinned,
                                      });
                                      setMenuOpen(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
                                  >
                                    {resource.is_pinned ? (
                                      <>
                                        <PinOff className="w-3.5 h-3.5" />
                                        Desepingler
                                      </>
                                    ) : (
                                      <>
                                        <Pin className="w-3.5 h-3.5" />
                                        Epingler
                                      </>
                                    )}
                                  </button>
                                  <div className="relative">
                                    <button
                                      onClick={() =>
                                        setMoveMenuOpen(
                                          moveMenuOpen === resource.id
                                            ? null
                                            : resource.id,
                                        )
                                      }
                                      className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
                                    >
                                      <FolderInput className="w-3.5 h-3.5" />
                                      Deplacer
                                    </button>
                                    {moveMenuOpen === resource.id && (
                                      <div className="absolute left-full top-0 ml-1 bg-surface border border-border rounded-xl shadow-lg py-1 w-44 max-h-48 overflow-y-auto">
                                        {resource.folder_id && (
                                          <button
                                            onClick={() => {
                                              moveResource.mutate({
                                                resourceId: resource.id,
                                                folderId: null,
                                              });
                                              setMenuOpen(null);
                                              setMoveMenuOpen(null);
                                            }}
                                            className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-muted transition-colors"
                                          >
                                            Hors dossier
                                          </button>
                                        )}
                                        {folders
                                          ?.filter(
                                            (f) => f.id !== resource.folder_id,
                                          )
                                          .map((f) => (
                                            <button
                                              key={f.id}
                                              onClick={() => {
                                                moveResource.mutate({
                                                  resourceId: resource.id,
                                                  folderId: f.id,
                                                });
                                                setMenuOpen(null);
                                                setMoveMenuOpen(null);
                                              }}
                                              className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-muted transition-colors truncate"
                                            >
                                              {f.icon ?? "📁"} {f.name}
                                            </button>
                                          ))}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          "Supprimer cette ressource ?",
                                        )
                                      ) {
                                        deleteResource.mutate({
                                          id: resource.id,
                                          file_url: resource.file_url,
                                        });
                                      }
                                      setMenuOpen(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-error hover:bg-error/5 flex items-center gap-2 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Supprimer
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty state */}
            {filtered.length === 0 &&
              !(isRoot && !search.trim() && folders && folders.length > 0) && (
                <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-2xl p-12 text-center border border-dashed border-border mt-3">
                  <FolderOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {search.trim() ? "Aucun resultat" : "Aucun fichier"}
                  </p>
                </div>
              )}
          </>
        )}
      </motion.div>

      {/* ═══ Modals ═══ */}
      <FolderFormModal
        open={showFolderForm}
        onClose={() => setShowFolderForm(false)}
        onSubmit={(data) => {
          createFolder.mutate(data, {
            onSuccess: () => setShowFolderForm(false),
          });
        }}
        isPending={createFolder.isPending}
      />

      <FolderPermissionsModal
        open={!!permissionsFolder}
        onClose={() => setPermissionsFolder(null)}
        folder={permissionsFolder}
      />
    </motion.div>
  );
}
