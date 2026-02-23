"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Loader2, Camera } from "lucide-react";
import { Profile } from "@/lib/types/database";
import { getInitials } from "@/lib/utils/formatters";
import { getRoleBadgeColor, getRoleLabel } from "@/lib/utils/roles";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  full_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  bio: z.string().optional(),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileForm({ profile }: { profile: Profile }) {
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name,
      bio: profile.bio || "",
      phone: profile.phone || "",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
        bio: data.bio || null,
        phone: data.phone || null,
      })
      .eq("id", profile.id);

    if (error) {
      toast.error("Erreur", { description: error.message });
    } else {
      toast.success("Profil mis à jour");
      router.refresh();
    }
    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop();
    const filePath = `${profile.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error("Erreur d'upload", { description: uploadError.message });
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", profile.id);

    setAvatarUrl(publicUrl);
    toast.success("Avatar mis à jour");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Avatar section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-xl">
                  {getInitials(profile.full_name || profile.email)}
                </AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <Camera className="h-5 w-5 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </label>
            </div>
            <div>
              <h3 className="font-semibold text-lg">{profile.full_name}</h3>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <Badge
                variant="outline"
                className={cn("mt-1 text-xs", getRoleBadgeColor(profile.role))}
              >
                {getRoleLabel(profile.role)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom complet</Label>
              <Input {...register("full_name")} className="bg-[#141414]" />
              {errors.full_name && (
                <p className="text-xs text-destructive">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile.email} disabled className="bg-[#1C1C1C] opacity-60" />
              <p className="text-xs text-muted-foreground">L&apos;email ne peut pas être modifié</p>
            </div>

            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                {...register("bio")}
                placeholder="Parlez-nous de vous..."
                className="min-h-[80px] bg-[#141414]"
              />
            </div>

            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                {...register("phone")}
                placeholder="+33 6 00 00 00 00"
                className="bg-[#141414]"
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sauvegarder
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Changer le mot de passe</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePassword />
        </CardContent>
      </Card>
    </div>
  );
}

function ChangePassword() {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const supabase = createClient();

  const handleChangePassword = async () => {
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error("Erreur", { description: error.message });
    } else {
      toast.success("Mot de passe mis à jour");
      setPassword("");
      setConfirm("");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nouveau mot de passe</Label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-[#141414]"
        />
      </div>
      <div className="space-y-2">
        <Label>Confirmer le mot de passe</Label>
        <Input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="bg-[#141414]"
        />
      </div>
      <Button onClick={handleChangePassword} disabled={loading} variant="outline">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Mettre à jour le mot de passe
      </Button>
    </div>
  );
}
