"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Megaphone, Send, Loader2, Users, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BroadcastClientProps {
  userId: string;
  stats: {
    total: number;
    admin: number;
    moderator: number;
    member: number;
    prospect: number;
  };
}

const TARGET_OPTIONS = [
  { value: "all", label: "Tous les utilisateurs" },
  { value: "member", label: "Membres uniquement" },
  { value: "prospect", label: "Prospects uniquement" },
  { value: "admin,moderator", label: "Staff (admins + modérateurs)" },
];

const TYPE_OPTIONS = [
  { value: "system", label: "Système" },
  { value: "formation", label: "Formation" },
  { value: "session", label: "Session" },
];

export function BroadcastClient({ userId, stats }: BroadcastClientProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [target, setTarget] = useState("all");
  const [type, setType] = useState("system");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const getTargetCount = (): number => {
    if (target === "all") return stats.total;
    if (target === "member") return stats.member;
    if (target === "prospect") return stats.prospect;
    if (target === "admin,moderator") return stats.admin + stats.moderator;
    return stats.total;
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Titre et message requis");
      return;
    }

    setSending(true);

    // Récupérer les utilisateurs ciblés
    let query = supabase.from("profiles").select("id");
    if (target === "member") {
      query = query.eq("role", "member");
    } else if (target === "prospect") {
      query = query.eq("role", "prospect");
    } else if (target === "admin,moderator") {
      query = query.in("role", ["admin", "moderator"]);
    }

    const { data: users, error: fetchError } = await query;

    if (fetchError || !users || users.length === 0) {
      toast.error("Aucun utilisateur trouvé");
      setSending(false);
      return;
    }

    // 1. Créer le post communauté d'abord pour avoir l'ID
    const linkHtml = link.trim()
      ? `<p></p><p><a href="${link.trim()}" target="_blank" rel="noopener noreferrer" style="color:#C6FF00;text-decoration:underline;">🔗 ${link.trim()}</a></p>`
      : "";
    const postContent = `<p>${message.trim().replace(/\n/g, "</p><p>")}</p>${linkHtml}`;
    const { data: newPost, error: postError } = await supabase
      .from("posts")
      .insert({
        author_id: userId,
        type: "announcement",
        title: title.trim(),
        content: postContent,
      })
      .select("id")
      .single();

    if (postError) {
      console.error("[broadcast] Post creation failed:", postError);
    }

    // 2. Créer les notifications avec le lien vers le post
    const postLink = newPost ? `/community/${newPost.id}` : (link.trim() || null);
    const notifications = users.map((u) => ({
      user_id: u.id,
      type,
      title: title.trim(),
      message: message.trim(),
      link: postLink,
    }));

    // Insérer par lots de 100
    let totalInserted = 0;
    for (let i = 0; i < notifications.length; i += 100) {
      const batch = notifications.slice(i, i + 100);
      const { error } = await supabase.from("notifications").insert(batch);
      if (error) {
        toast.error(`Erreur lot ${Math.floor(i / 100) + 1}`, {
          description: error.message,
        });
        setSending(false);
        return;
      }
      totalInserted += batch.length;
    }

    // Envoyer aussi les push notifications
    try {
      await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_ids: users.map((u: { id: string }) => u.id),
          title: title || "Annonce UPSCALE",
          body: message,
          url: link || "/notifications",
          tag: "broadcast",
        }),
      });
    } catch { /* Push non bloquant */ }

    toast.success(`Annonce envoyée à ${totalInserted} utilisateur(s)${newPost ? " + publiée dans la communauté" : ""}`);
    setSent(true);
    setSending(false);

    // Reset après 3s
    setTimeout(() => {
      setTitle("");
      setMessage("");
      setLink("");
      setTarget("all");
      setType("system");
      setSent(false);
    }, 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" />
          Annonces
        </h1>
        <p className="text-muted-foreground">
          Envoyez une notification à un groupe d&apos;utilisateurs
        </p>
      </div>

      {/* Stats des utilisateurs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", count: stats.total, active: target === "all" },
          { label: "Membres", count: stats.member, active: target === "member" },
          { label: "Prospects", count: stats.prospect, active: target === "prospect" },
          { label: "Staff", count: stats.admin + stats.moderator, active: target === "admin,moderator" },
        ].map((s) => (
          <Card
            key={s.label}
            className={cn(
              "transition-colors",
              s.active && "border-primary/30 bg-primary/5"
            )}
          >
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-xl font-bold">{s.count}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Formulaire */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Composer une annonce</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Audience cible</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger className="bg-[#141414]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-[#141414]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Titre</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nouvelle formation disponible !"
              className="bg-[#141414]"
            />
          </div>

          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Détails de votre annonce..."
              className="bg-[#141414] min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label>
              Lien (optionnel)
            </Label>
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="/formations ou /community"
              className="bg-[#141414]"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {getTargetCount()} destinataire{getTargetCount() > 1 ? "s" : ""}
              </span>
            </div>

            {sent ? (
              <Button disabled className="bg-neon/20 text-neon border-neon/30">
                <CheckCircle className="mr-2 h-4 w-4" />
                Envoyée !
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={!title.trim() || !message.trim() || sending}>
                    {sending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Envoyer l&apos;annonce
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer l&apos;envoi</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette annonce sera envoyée à{" "}
                      <strong>{getTargetCount()} utilisateur(s)</strong>. Cette
                      action est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSend}>
                      Confirmer et envoyer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
