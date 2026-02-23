"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [platformName, setPlatformName] = useState("UPSCALES");
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [defaultRole, setDefaultRole] = useState("prospect");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

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
              className="bg-secondary/50"
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
            <select
              value={defaultRole}
              onChange={(e) => setDefaultRole(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm"
            >
              <option value="prospect">Prospect</option>
              <option value="member">Membre</option>
            </select>
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
