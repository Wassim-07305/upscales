"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils/formatters";
import { formatDate } from "@/lib/utils/dates";
import { toast } from "sonner";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChevronLeft, Mail, Phone, Calendar, Shield, Zap, Trophy, Award,
  BookOpen, Ban, RotateCcw, Key, Save, Loader2, UserCircle,
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  moderator: "Modérateur",
  member: "Membre",
  prospect: "Prospect",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500/20 text-red-400 border-red-500/30",
  moderator: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  member: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  prospect: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

interface UserDetailClientProps {
  profile: Profile;
  isAdmin: boolean;
  enrollments: { id: string; formation_id: string; completed_at: string | null; formation: { id: string; title: string } | null }[];
  certificates: { id: string; formation: { title: string } | null }[];
  postCount: number;
  xp: number;
  level: number;
}

export function UserDetailClient({ profile: initialProfile, isAdmin, enrollments, certificates, postCount, xp, level }: UserDetailClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState(initialProfile);
  const [editForm, setEditForm] = useState({
    full_name: profile.full_name || "",
    email: profile.email || "",
    phone: profile.phone || "",
    bio: profile.bio || "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const completedFormations = enrollments.filter((e) => e.completed_at);
  const inProgressFormations = enrollments.filter((e) => !e.completed_at);

  // Update profile
  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editForm.full_name.trim(),
        phone: editForm.phone.trim() || null,
        bio: editForm.bio.trim() || null,
      })
      .eq("id", profile.id);
    setSaving(false);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
      return;
    }
    setProfile((p) => ({ ...p, full_name: editForm.full_name.trim(), phone: editForm.phone.trim() || null, bio: editForm.bio.trim() || null }));
    toast.success("Profil mis à jour");
  };

  // Change role
  const handleRoleChange = async (newRole: string) => {
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", profile.id);
    if (error) {
      toast.error("Erreur lors du changement de rôle");
      return;
    }
    setProfile((p) => ({ ...p, role: newRole as Profile["role"] }));
    toast.success(`Rôle changé : ${ROLE_LABELS[newRole]}`);
  };

  // Suspend / unsuspend
  const handleToggleSuspend = async () => {
    const updates = profile.is_suspended
      ? { is_suspended: false, suspended_at: null, suspended_reason: null }
      : { is_suspended: true, suspended_at: new Date().toISOString(), suspended_reason: "Suspendu par admin" };

    const { error } = await supabase.from("profiles").update(updates).eq("id", profile.id);
    if (error) {
      toast.error("Erreur");
      return;
    }
    setProfile((p) => ({ ...p, ...updates } as Profile));
    toast.success(profile.is_suspended ? "Compte réactivé" : "Compte suspendu");
  };

  // Reset password (admin only — via Supabase admin API route)
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Le mot de passe doit faire au moins 6 caractères");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur serveur");
      }
      toast.success("Mot de passe réinitialisé");
      setNewPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
    setSavingPassword(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/users")} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4 mr-1" />Retour
          </Button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-14 w-14">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-lg bg-primary/20 text-primary">{getInitials(profile.full_name || "?")}</AvatarFallback>
              </Avatar>
              {profile.is_online && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-card" />}
            </div>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                {profile.full_name || "Sans nom"}
                {profile.is_suspended && <Badge variant="outline" className="text-[10px] bg-amber-500/20 text-amber-400">Suspendu</Badge>}
              </h1>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>
        </div>
        <Badge variant="outline" className={cn("text-xs", ROLE_COLORS[profile.role])}>
          {ROLE_LABELS[profile.role] || profile.role}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Zap} label="XP" value={xp} color="text-[#C6FF00]" />
        <StatCard icon={Trophy} label="Niveau" value={`Niv. ${level}`} color="text-amber-400" />
        <StatCard icon={Award} label="Certificats" value={certificates.length} color="text-emerald-400" />
        <StatCard icon={BookOpen} label="Publications" value={postCount} color="text-blue-400" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="infos" className="space-y-6">
        <TabsList className="bg-[#141414] border border-white/10">
          <TabsTrigger value="infos">Informations</TabsTrigger>
          <TabsTrigger value="formations">Formations</TabsTrigger>
          {isAdmin && <TabsTrigger value="admin">Administration</TabsTrigger>}
        </TabsList>

        {/* INFOS TAB */}
        <TabsContent value="infos" className="space-y-4">
          <Card className="bg-[#141414] border-white/10">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserCircle className="h-4 w-4 text-[#C6FF00]" />Profil</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom complet</Label>
                  <Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} className="bg-black/30 border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={editForm.email} disabled className="bg-black/30 border-white/10 opacity-60" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="+33 6 ..." className="bg-black/30 border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label>Inscrit le</Label>
                  <Input value={formatDate(profile.created_at)} disabled className="bg-black/30 border-white/10 opacity-60" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Input value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} placeholder="Bio de l'utilisateur..." className="bg-black/30 border-white/10" />
              </div>
              <Button onClick={handleSaveProfile} disabled={saving} className="bg-[#C6FF00] text-black hover:bg-[#C6FF00]/90">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Enregistrer
              </Button>
            </CardContent>
          </Card>

          {/* Connection info */}
          <Card className="bg-[#141414] border-white/10">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email :</span>
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Téléphone :</span>
                <span>{profile.phone || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Dernière connexion :</span>
                <span>{profile.last_seen_at ? formatDate(profile.last_seen_at) : "Jamais"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Statut :</span>
                {profile.is_online ? (
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/20 text-emerald-400">En ligne</Badge>
                ) : (
                  <span className="text-muted-foreground">Hors ligne</span>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FORMATIONS TAB */}
        <TabsContent value="formations" className="space-y-4">
          <Card className="bg-[#141414] border-white/10">
            <CardHeader><CardTitle className="text-base">Formations ({enrollments.length})</CardTitle></CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune formation suivie</p>
              ) : (
                <div className="space-y-3">
                  {completedFormations.map((e) => (
                    <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center"><Award className="h-4 w-4 text-emerald-400" /></div>
                        <div>
                          <p className="text-sm font-medium">{(e.formation as { title: string } | null)?.title || "Formation"}</p>
                          <p className="text-[10px] text-emerald-400">Terminée le {e.completed_at ? formatDate(e.completed_at) : ""}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/20 text-emerald-400">Terminée</Badge>
                    </div>
                  ))}
                  {inProgressFormations.map((e) => (
                    <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center"><BookOpen className="h-4 w-4 text-blue-400" /></div>
                        <div>
                          <p className="text-sm font-medium">{(e.formation as { title: string } | null)?.title || "Formation"}</p>
                          <p className="text-[10px] text-muted-foreground">En cours</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-blue-500/20 text-blue-400">En cours</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {certificates.length > 0 && (
            <Card className="bg-[#141414] border-white/10">
              <CardHeader><CardTitle className="text-base">Certificats ({certificates.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {certificates.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                      <Award className="h-5 w-5 text-[#C6FF00]" />
                      <span className="text-sm">{(c.formation as { title: string } | null)?.title || "Certificat"}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ADMIN TAB */}
        {isAdmin && (
          <TabsContent value="admin" className="space-y-4">
            {/* Role management */}
            <Card className="bg-[#141414] border-white/10">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-[#C6FF00]" />Rôle & Permissions</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Rôle</Label>
                  <Select value={profile.role} onValueChange={handleRoleChange}>
                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="moderator">Modérateur</SelectItem>
                      <SelectItem value="member">Membre</SelectItem>
                      <SelectItem value="prospect">Prospect</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <Button
                    variant={profile.is_suspended ? "default" : "destructive"}
                    size="sm"
                    onClick={handleToggleSuspend}
                  >
                    {profile.is_suspended ? (
                      <><RotateCcw className="h-4 w-4 mr-2" />Réactiver le compte</>
                    ) : (
                      <><Ban className="h-4 w-4 mr-2" />Suspendre le compte</>
                    )}
                  </Button>
                </div>
                {profile.is_suspended && profile.suspended_at && (
                  <p className="text-xs text-amber-400">
                    Suspendu le {formatDate(profile.suspended_at)}
                    {profile.suspended_reason && ` — ${profile.suspended_reason}`}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Password reset */}
            <Card className="bg-[#141414] border-white/10">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Key className="h-4 w-4 text-[#C6FF00]" />Réinitialiser le mot de passe</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nouveau mot de passe</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 caractères"
                    className="bg-black/30 border-white/10"
                  />
                </div>
                <Button onClick={handleResetPassword} disabled={savingPassword || !newPassword} variant="outline" size="sm">
                  {savingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
                  Réinitialiser
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <Card className="bg-[#141414] border-white/10">
      <CardContent className="pt-6 text-center">
        <Icon className={cn("h-5 w-5 mx-auto mb-1", color)} />
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
