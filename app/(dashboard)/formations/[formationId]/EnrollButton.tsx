"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function EnrollButton({ formationId }: { formationId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleEnroll = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Vous devez être connecté");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("formation_enrollments").insert({
      user_id: user.id,
      formation_id: formationId,
    });

    if (error) {
      toast.error("Erreur lors de l'inscription", { description: error.message });
    } else {
      toast.success("Inscription réussie !");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <Button onClick={handleEnroll} disabled={loading} className="w-full">
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      S&apos;inscrire à la formation
    </Button>
  );
}
