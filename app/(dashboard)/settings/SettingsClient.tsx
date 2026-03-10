"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  MessageCircle,
  Globe,
  BookOpen,
  CalendarDays,
  Award,
  Bell,
  LogOut,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Profile, NotificationType, NotificationPreferences } from "@/lib/types/database";
import { toast } from "sonner";

const NOTIFICATION_TYPES: {
  key: NotificationType;
  label: string;
  description: string;
  icon: typeof Bell;
}[] = [
  {
    key: "message",
    label: "Messages",
    description: "Nouveaux messages dans vos conversations",
    icon: MessageCircle,
  },
  {
    key: "post",
    label: "Communauté",
    description: "Commentaires, likes et réponses à vos posts",
    icon: Globe,
  },
  {
    key: "formation",
    label: "Formations",
    description: "Inscriptions, complétion et mises à jour",
    icon: BookOpen,
  },
  {
    key: "session",
    label: "Sessions",
    description: "Rappels et confirmations de sessions",
    icon: CalendarDays,
  },
  {
    key: "certificate",
    label: "Certificats",
    description: "Nouveaux certificats obtenus",
    icon: Award,
  },
  {
    key: "system",
    label: "Système",
    description: "Annonces et notifications de la plateforme",
    icon: Bell,
  },
];

const DEFAULT_PREFS: NotificationPreferences = {
  message: true,
  post: true,
  formation: true,
  session: true,
  certificate: true,
  system: true,
};

export function SettingsClient({ profile }: { profile: Profile }) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(
    profile.notification_preferences || DEFAULT_PREFS
  );
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleToggle = async (key: NotificationType, checked: boolean) => {
    const newPrefs = { ...prefs, [key]: checked };
    setPrefs(newPrefs);

    const { error } = await supabase
      .from("profiles")
      .update({ notification_preferences: newPrefs })
      .eq("id", profile.id);

    if (error) {
      setPrefs(prefs);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleToggleAll = async (enabled: boolean) => {
    setSaving(true);
    const newPrefs: NotificationPreferences = {
      message: enabled,
      post: enabled,
      formation: enabled,
      session: enabled,
      certificate: enabled,
      system: enabled,
    };
    setPrefs(newPrefs);

    const { error } = await supabase
      .from("profiles")
      .update({ notification_preferences: newPrefs })
      .eq("id", profile.id);

    if (error) {
      setPrefs(prefs);
      toast.error("Erreur lors de la sauvegarde");
    } else {
      toast.success(enabled ? "Toutes les notifications activées" : "Toutes les notifications désactivées");
    }
    setSaving(false);
  };

  const allEnabled = Object.values(prefs).every(Boolean);
  const allDisabled = Object.values(prefs).every((v) => !v);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "SUPPRIMER") return;
    setDeleting(true);

    // Supprime les données utilisateur (les cascades DB gèrent le reste)
    const { error } = await supabase.from("profiles").delete().eq("id", profile.id);

    if (error) {
      toast.error("Erreur lors de la suppression du compte");
      setDeleting(false);
      return;
    }

    await supabase.auth.signOut();
    router.push("/login");
    toast.success("Compte supprimé");
  };

  return (
    <div className="space-y-6">
      {/* Notification preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Préférences de notifications</CardTitle>
              <CardDescription>
                Choisissez les types de notifications que vous souhaitez recevoir
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleAll(!allEnabled)}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {allEnabled ? "Tout désactiver" : "Tout activer"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {NOTIFICATION_TYPES.map((notif, index) => {
              const Icon = notif.icon;
              return (
                <div key={notif.key}>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted/50">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">{notif.label}</Label>
                        <p className="text-xs text-muted-foreground">{notif.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={prefs[notif.key]}
                      onCheckedChange={(checked) => handleToggle(notif.key, checked)}
                    />
                  </div>
                  {index < NOTIFICATION_TYPES.length - 1 && <Separator />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Account actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Se déconnecter</p>
              <p className="text-xs text-muted-foreground">Fermer votre session sur cet appareil</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Déconnexion
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-destructive">Supprimer le compte</p>
              <p className="text-xs text-muted-foreground">
                Suppression définitive de toutes vos données
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Supprimer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete account dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer votre compte</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Toutes vos données, certificats et progression seront
              définitivement supprimés.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Tapez <span className="font-mono font-bold text-destructive">SUPPRIMER</span> pour confirmer
              </Label>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="SUPPRIMER"
                className="bg-[#141414]"
              />
            </div>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== "SUPPRIMER" || deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer définitivement mon compte
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
