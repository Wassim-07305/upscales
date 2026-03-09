"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, Video, Send, Loader2 } from "lucide-react";
import { Profile } from "@/lib/types/database";
import { getInitials } from "@/lib/utils/formatters";
import { toast } from "sonner";

interface CreatePostProps {
  user: Profile;
}

export function CreatePost({ user }: CreatePostProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setLoading(true);

    const { error } = await supabase.from("posts").insert({
      author_id: user.id,
      content: content.trim(),
      type: "text",
    });

    if (error) {
      toast.error("Erreur", { description: error.message });
    } else {
      setContent("");
      toast.success("Post publié !");
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
            <Textarea
              placeholder="Partagez quelque chose avec la communauté..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[80px] resize-none bg-muted/50 border-0"
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-muted-foreground" disabled>
                  <ImageIcon className="h-4 w-4 mr-1" />
                  Image
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground" disabled>
                  <Video className="h-4 w-4 mr-1" />
                  Vidéo
                </Button>
              </div>
              <Button onClick={handleSubmit} disabled={!content.trim() || loading} size="sm">
                {loading ? (
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
