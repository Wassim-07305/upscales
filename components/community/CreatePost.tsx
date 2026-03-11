"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, Video, Send, Loader2, X, Type } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { showXPToast } from "@/components/gamification/XPToast";
import { Profile, PostType } from "@/lib/types/database";
import { getInitials } from "@/lib/utils/formatters";
import { toast } from "sonner";

interface CreatePostProps {
  user: Profile;
}

export function CreatePost({ user }: CreatePostProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [richMode, setRichMode] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleFileSelect = (file: File, type: "image" | "video") => {
    // Limite : 10 Mo pour images, 50 Mo pour vidéos
    const maxSize = type === "image" ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Fichier trop volumineux (max ${type === "image" ? "10" : "50"} Mo)`);
      return;
    }

    setMediaFile(file);
    setMediaType(type);

    const url = URL.createObjectURL(file);
    setMediaPreview(url);
  };

  const handleRemoveMedia = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const uploadMedia = async (file: File): Promise<string | null> => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "media");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur d'upload");
      }

      const { url } = await res.json();
      return url;
    } catch (err) {
      toast.error("Erreur lors de l'upload du fichier");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !mediaFile) return;

    setLoading(true);
    let mediaUrl: string | null = null;
    let postType: PostType = "text";

    if (mediaFile && mediaType) {
      mediaUrl = await uploadMedia(mediaFile);
      if (!mediaUrl) {
        setLoading(false);
        return;
      }
      postType = mediaType;
    }

    const { error } = await supabase.from("posts").insert({
      author_id: user.id,
      content: content.trim() || "",
      type: postType,
      media_url: mediaUrl,
    });

    if (error) {
      toast.error("Erreur", { description: error.message });
    } else {
      setContent("");
      handleRemoveMedia();
      toast.success("Post publié !");
      // Attribuer XP pour le post
      try {
        const xpRes = await fetch("/api/xp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "post_create" }),
        });
        if (xpRes.ok) {
          const xpData = await xpRes.json();
          showXPToast(xpData.xp_awarded, xpData.new_badges?.[0]?.name);
        }
      } catch { /* XP non bloquant */ }
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-sm">
              {getInitials(user.full_name || user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            {richMode ? (
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Partagez quelque chose avec la communauté..."
                minHeight="80px"
              />
            ) : (
              <Textarea
                placeholder="Partagez quelque chose avec la communauté..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[80px] resize-none bg-muted/50 border-0"
              />
            )}

            {/* Aperçu média */}
            {mediaPreview && (
              <div className="relative mt-3 rounded-lg overflow-hidden border border-border bg-[#141414]">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-10 h-7 w-7 bg-background/80 hover:bg-background"
                  onClick={handleRemoveMedia}
                >
                  <X className="h-4 w-4" />
                </Button>
                {mediaType === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaPreview}
                    alt="Aperçu"
                    className="max-h-64 w-full object-contain"
                  />
                ) : (
                  <video
                    src={mediaPreview}
                    controls
                    className="max-h-64 w-full"
                  />
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={richMode ? "text-primary" : "text-muted-foreground hover:text-foreground"}
                  onClick={() => setRichMode(!richMode)}
                  disabled={loading || uploading}
                >
                  <Type className="h-4 w-4 mr-1" />
                  Mise en forme
                </Button>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file, "image");
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={loading || uploading}
                >
                  <ImageIcon className="h-4 w-4 mr-1" />
                  Image
                </Button>

                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file, "video");
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={loading || uploading}
                >
                  <Video className="h-4 w-4 mr-1" />
                  Vidéo
                </Button>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={(!content.trim() && !mediaFile) || loading || uploading}
                size="sm"
              >
                {loading || uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    Publier
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
