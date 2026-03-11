"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [platformName, setPlatformName] = useState("UPSCALE");
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [defaultRole, setDefaultRole] = useState("prospect");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Charger les paramètres existants depuis la base de données
  useEffect(() => {
    async function loadSettings() {
      const { data } = await supabase
        .from("platform_settings")
        .select("key, value");

      if (data) {
        for (const setting of data) {
          const val = setting.value as Record<string, unknown>;
          switch (setting.key) {
            case "platform_name":
              if (val.name) setPlatformName(val.name as string);
              break;
            case "allow_registration":
              if (val.enabled !== undefined) setAllowRegistration(val.enabled as boolean);
              break;
            case "default_role":
              if (val.role) setDefaultRole(val.role as string);
              break;
          }
        }
      }
      setLoading(false);
    }
    loadSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);

    const settings = [
      { key: "platform_name", value: { name: platformName } },
      { key: "allow_registration", value: { enabled: allowRegistration } },
      { key: "default_role", value: { role: defaultRole } },
    ];

    for (const setting of settings) {
      await supabase.from("platform_settings").upsert(
        { key: setting.key, value: setting.value },
        { onConflict: "key" }
      );
    }

    toast.success("Paramètres sauvegardés");
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">Configuration de la plateforme</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Général</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nom de la plateforme</Label>
            <Input
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              className="bg-[#141414]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inscriptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Autoriser les inscriptions</Label>
              <p className="text-xs text-muted-foreground">
                Les nouveaux utilisateurs peuvent créer un compte
              </p>
            </div>
            <Switch checked={allowRegistration} onCheckedChange={setAllowRegistration} />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Rôle par défaut</Label>
            <Select value={defaultRole} onValueChange={setDefaultRole}>
              <SelectTrigger className="bg-[#141414]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="member">Membre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stockage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Les buckets Supabase Storage doivent être configurés manuellement dans le dashboard Supabase :
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>• <strong>avatars</strong> — Photos de profil (public)</li>
            <li>• <strong>videos</strong> — Vidéos de formation (privé)</li>
            <li>• <strong>media</strong> — Médias du feed (public)</li>
            <li>• <strong>thumbnails</strong> — Miniatures (public)</li>
            <li>• <strong>certificates</strong> — Certificats PDF (privé)</li>
          </ul>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Sauvegarder les paramètres
      </Button>
    </div>
  );
}
