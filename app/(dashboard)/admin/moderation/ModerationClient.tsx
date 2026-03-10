"use client";

// Note: Post content uses dangerouslySetInnerHTML for consistency with the existing
// PostCard component pattern. Content is stored by authenticated users only and
// displayed in the admin moderation panel for review purposes.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  Flag,
} from "lucide-react";
import { timeAgo } from "@/lib/utils/dates";
import { getInitials } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ReportPost {
  id: string;
  content: string;
  title: string | null;
  type: string;
  media_url: string | null;
  author_id: string;
  created_at: string;
  author: {
    full_name: string;
    avatar_url: string | null;
    role: string;
  } | null;
}

interface Report {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: string;
  status: "pending" | "reviewed" | "dismissed";
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  post: ReportPost | null;
  reporter: { full_name: string } | null;
}

interface ModerationClientProps {
  initialReports: Report[];
  pendingCount: number;
  moderatorId: string;
}

const STATUS_CONFIG = {
  pending: {
    label: "En attente",
    variant: "outline" as const,
    className: "border-[#FFB800]/50 text-[#FFB800]",
    icon: AlertTriangle,
  },
  reviewed: {
    label: "Traité",
    variant: "outline" as const,
    className: "border-neon/50 text-neon",
    icon: CheckCircle,
  },
  dismissed: {
    label: "Rejeté",
    variant: "outline" as const,
    className: "border-muted-foreground/50 text-muted-foreground",
    icon: XCircle,
  },
};

const REASON_LABELS: Record<string, string> = {
  inappropriate: "Contenu inapproprié",
  spam: "Spam",
  harassment: "Harcèlement",
  misinformation: "Désinformation",
  other: "Autre",
};

export function ModerationClient({
  initialReports,
  pendingCount: initialPendingCount,
  moderatorId,
}: ModerationClientProps) {
  const [reports, setReports] = useState(initialReports);
  const [pendingCount, setPendingCount] = useState(initialPendingCount);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const pendingReports = reports.filter((r) => r.status === "pending");
  const reviewedReports = reports.filter((r) => r.status === "reviewed");
  const dismissedReports = reports.filter((r) => r.status === "dismissed");

  const handleUpdateStatus = async (
    reportId: string,
    newStatus: "reviewed" | "dismissed"
  ) => {
    setProcessing(true);

    const { error } = await supabase
      .from("post_reports")
      .update({
        status: newStatus,
        reviewed_by: moderatorId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
    } else {
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? {
                ...r,
                status: newStatus,
                reviewed_by: moderatorId,
                reviewed_at: new Date().toISOString(),
              }
            : r
        )
      );
      setPendingCount((prev) => Math.max(0, prev - 1));
      toast.success(
        newStatus === "reviewed"
          ? "Signalement traité"
          : "Signalement rejeté"
      );
    }
    setProcessing(false);
    setSelectedReport(null);
  };

  const handleDeletePost = async (postId: string) => {
    setProcessing(true);

    const { error } = await supabase.from("posts").delete().eq("id", postId);

    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      await supabase
        .from("post_reports")
        .update({
          status: "reviewed",
          reviewed_by: moderatorId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("post_id", postId);

      setReports((prev) =>
        prev.map((r) =>
          r.post_id === postId
            ? {
                ...r,
                status: "reviewed" as const,
                reviewed_by: moderatorId,
                reviewed_at: new Date().toISOString(),
                post: null,
              }
            : r
        )
      );
      setPendingCount((prev) =>
        Math.max(
          0,
          prev -
            reports.filter(
              (r) => r.post_id === postId && r.status === "pending"
            ).length
        )
      );
      toast.success("Post supprimé et signalements traités");
    }
    setProcessing(false);
    setSelectedReport(null);
  };

  const renderReportCard = (report: Report) => {
    const config = STATUS_CONFIG[report.status];
    const StatusIcon = config.icon;
    const post = report.post;

    return (
      <Card
        key={report.id}
        className="cursor-pointer hover:border-border/80 transition-colors"
        onClick={() => setSelectedReport(report)}
      >
        <CardContent className="pt-5 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant={config.variant}
                  className={cn("text-xs", config.className)}
                >
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {REASON_LABELS[report.reason] || report.reason}
                </span>
              </div>

              {post ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={post.author?.avatar_url || undefined}
                      />
                      <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                        {getInitials(post.author?.full_name || "")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {post.author?.full_name || "Utilisateur supprimé"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {post.title || stripHtml(post.content).slice(0, 120)}
                    {!post.title && stripHtml(post.content).length > 120
                      ? "..."
                      : ""}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Post supprimé
                </p>
              )}
            </div>

            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground">
                {timeAgo(report.created_at)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                par {report.reporter?.full_name || "Anonyme"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Modération
          </h1>
          <p className="text-muted-foreground">
            Gérez les signalements de la communauté
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-[#FFB800]/20 text-[#FFB800] border-[#FFB800]/30">
            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
            {pendingCount} en attente
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#FFB800]/10">
                <AlertTriangle className="h-5 w-5 text-[#FFB800]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingReports.length}</p>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-neon/10">
                <CheckCircle className="h-5 w-5 text-neon" />
              </div>
              <div>
                <p className="text-2xl font-bold">{reviewedReports.length}</p>
                <p className="text-xs text-muted-foreground">Traités</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-muted">
                <XCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dismissedReports.length}</p>
                <p className="text-xs text-muted-foreground">Rejetés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-1.5">
            En attente
            {pendingReports.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#FFB800]/20 text-[#FFB800]">
                {pendingReports.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="reviewed">Traités</TabsTrigger>
          <TabsTrigger value="dismissed">Rejetés</TabsTrigger>
          <TabsTrigger value="all">Tous</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 mt-4">
          {pendingReports.length === 0 ? (
            <EmptyState message="Aucun signalement en attente" />
          ) : (
            pendingReports.map(renderReportCard)
          )}
        </TabsContent>

        <TabsContent value="reviewed" className="space-y-3 mt-4">
          {reviewedReports.length === 0 ? (
            <EmptyState message="Aucun signalement traité" />
          ) : (
            reviewedReports.map(renderReportCard)
          )}
        </TabsContent>

        <TabsContent value="dismissed" className="space-y-3 mt-4">
          {dismissedReports.length === 0 ? (
            <EmptyState message="Aucun signalement rejeté" />
          ) : (
            dismissedReports.map(renderReportCard)
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-3 mt-4">
          {reports.length === 0 ? (
            <EmptyState message="Aucun signalement" />
          ) : (
            reports.map(renderReportCard)
          )}
        </TabsContent>
      </Tabs>

      {/* Detail dialog */}
      <Dialog
        open={!!selectedReport}
        onOpenChange={() => setSelectedReport(null)}
      >
        <DialogContent className="max-w-lg">
          {selectedReport && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5 text-[#FFB800]" />
                  Détail du signalement
                </DialogTitle>
                <DialogDescription>
                  {REASON_LABELS[selectedReport.reason] ||
                    selectedReport.reason}{" "}
                  — signalé {timeAgo(selectedReport.created_at)} par{" "}
                  {selectedReport.reporter?.full_name || "Anonyme"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {selectedReport.post ? (
                  <Card className="bg-muted/30">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={
                              selectedReport.post.author?.avatar_url ||
                              undefined
                            }
                          />
                          <AvatarFallback className="text-xs bg-primary/20 text-primary">
                            {getInitials(
                              selectedReport.post.author?.full_name || ""
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {selectedReport.post.author?.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {timeAgo(selectedReport.post.created_at)}
                          </p>
                        </div>
                      </div>

                      {selectedReport.post.title && (
                        <h4 className="font-medium text-sm mb-1">
                          {selectedReport.post.title}
                        </h4>
                      )}

                      {/* Post content rendered as text for moderation review.
                          Uses same pattern as PostCard.tsx in the community feed. */}
                      <div
                        className="text-sm prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: selectedReport.post.content,
                        }}
                      />

                      {selectedReport.post.media_url && (
                        <div className="mt-2 rounded-lg overflow-hidden">
                          {selectedReport.post.type === "video" ? (
                            <video
                              src={selectedReport.post.media_url}
                              controls
                              className="w-full max-h-48"
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={selectedReport.post.media_url}
                              alt=""
                              className="w-full max-h-48 object-cover"
                            />
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-sm text-muted-foreground italic text-center py-4">
                    Ce post a été supprimé
                  </p>
                )}

                {/* Actions */}
                {selectedReport.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() =>
                        handleUpdateStatus(selectedReport.id, "dismissed")
                      }
                      disabled={processing}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeter
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-neon/30 text-neon hover:bg-neon/10"
                      onClick={() =>
                        handleUpdateStatus(selectedReport.id, "reviewed")
                      }
                      disabled={processing}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marquer traité
                    </Button>
                    {selectedReport.post && (
                      <Button
                        variant="destructive"
                        onClick={() =>
                          handleDeletePost(selectedReport.post_id)
                        }
                        disabled={processing}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer le post
                      </Button>
                    )}
                  </div>
                )}

                {selectedReport.status !== "pending" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {selectedReport.status === "reviewed" ? (
                      <CheckCircle className="h-4 w-4 text-neon" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <span>
                      {selectedReport.status === "reviewed"
                        ? "Traité"
                        : "Rejeté"}
                      {selectedReport.reviewed_at &&
                        ` ${timeAgo(selectedReport.reviewed_at)}`}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center">
      <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}
