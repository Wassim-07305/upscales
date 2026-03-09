"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function BookingPageFormDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [slotDuration, setSlotDuration] = useState("30");
  const [bufferMinutes, setBufferMinutes] = useState("0");
  const [minNoticeHours, setMinNoticeHours] = useState("24");
  const [maxDaysAhead, setMaxDaysAhead] = useState("30");

  function handleTitleChange(value: string) {
    setTitle(value);
    setSlug(slugify(value));
  }

  function resetForm() {
    setTitle("");
    setSlug("");
    setDescription("");
    setSlotDuration("30");
    setBufferMinutes("0");
    setMinNoticeHours("24");
    setMaxDaysAhead("30");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !slug.trim()) {
      toast.error("Le titre et le slug sont requis");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("booking_pages").insert({
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        slot_duration: parseInt(slotDuration),
        buffer_minutes: parseInt(bufferMinutes),
        min_notice_hours: parseInt(minNoticeHours),
        max_days_ahead: parseInt(maxDaysAhead),
        is_active: true,
        brand_color: "#C6FF00",
        qualification_fields: [],
        timezone: "Europe/Paris",
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Ce slug est déjà utilisé");
          return;
        }
        throw error;
      }

      toast.success("Page de réservation créée");
      resetForm();
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Créer une page
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvelle page de réservation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Titre</Label>
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Ex : Appel découverte"
              className="bg-[#141414] border-[#2A2A2A]"
              required
            />
          </div>

          <div className="space-y-1">
            <Label>Slug</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="appel-decouverte"
              className="bg-[#141414] border-[#2A2A2A]"
              required
            />
            <p className="text-xs text-muted-foreground">
              URL : /book/{slug || "..."}
            </p>
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description affichée sur la page de réservation..."
              className="bg-[#141414] border-[#2A2A2A] resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Durée du créneau</Label>
              <Select value={slotDuration} onValueChange={setSlotDuration}>
                <SelectTrigger className="bg-[#141414] border-[#2A2A2A]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Buffer (min)</Label>
              <Input
                type="number"
                value={bufferMinutes}
                onChange={(e) => setBufferMinutes(e.target.value)}
                min={0}
                max={60}
                className="bg-[#141414] border-[#2A2A2A]"
              />
            </div>

            <div className="space-y-1">
              <Label>Préavis min (heures)</Label>
              <Input
                type="number"
                value={minNoticeHours}
                onChange={(e) => setMinNoticeHours(e.target.value)}
                min={1}
                max={168}
                className="bg-[#141414] border-[#2A2A2A]"
              />
            </div>

            <div className="space-y-1">
              <Label>Jours max</Label>
              <Input
                type="number"
                value={maxDaysAhead}
                onChange={(e) => setMaxDaysAhead(e.target.value)}
                min={1}
                max={90}
                className="bg-[#141414] border-[#2A2A2A]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Création..." : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
