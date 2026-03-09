"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ArrowLeft, Save } from "lucide-react";
import {
  BookingPage,
  BookingAvailability,
  BookingException,
  Booking,
  QualificationField,
} from "@/lib/types/database";
import { AvailabilityEditor } from "@/components/booking/admin/AvailabilityEditor";
import { ExceptionEditor } from "@/components/booking/admin/ExceptionEditor";
import { QualificationFieldEditor } from "@/components/booking/admin/QualificationFieldEditor";
import { BookingsTable } from "@/components/booking/admin/BookingsTable";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface BookingPageDetailProps {
  bookingPage: BookingPage;
  availability: BookingAvailability[];
  exceptions: BookingException[];
  bookings: Booking[];
}

export function BookingPageDetail({
  bookingPage,
  availability,
  exceptions,
  bookings,
}: BookingPageDetailProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Formulaire de paramètres
  const [title, setTitle] = useState(bookingPage.title || "");
  const [slug, setSlug] = useState(bookingPage.slug);
  const [description, setDescription] = useState(bookingPage.description || "");
  const [slotDuration, setSlotDuration] = useState(String(bookingPage.slot_duration));
  const [bufferMinutes, setBufferMinutes] = useState(String(bookingPage.buffer_minutes));
  const [minNoticeHours, setMinNoticeHours] = useState(String(bookingPage.min_notice_hours));
  const [maxDaysAhead, setMaxDaysAhead] = useState(String(bookingPage.max_days_ahead));
  const [brandColor, setBrandColor] = useState(bookingPage.brand_color);
  const [isActive, setIsActive] = useState(bookingPage.is_active);
  const [qualificationFields, setQualificationFields] = useState<QualificationField[]>(
    bookingPage.qualification_fields || []
  );

  async function handleSave() {
    if (!title.trim() || !slug.trim()) {
      toast.error("Le titre et le slug sont requis");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("booking_pages")
        .update({
          title: title.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          slot_duration: parseInt(slotDuration),
          buffer_minutes: parseInt(bufferMinutes),
          min_notice_hours: parseInt(minNoticeHours),
          max_days_ahead: parseInt(maxDaysAhead),
          brand_color: brandColor,
          is_active: isActive,
          qualification_fields: qualificationFields,
        })
        .eq("id", bookingPage.id);

      if (error) {
        if (error.code === "23505") {
          toast.error("Ce slug est déjà utilisé par une autre page");
          return;
        }
        throw error;
      }

      toast.success("Paramètres enregistrés");
      router.refresh();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <Link
          href="/admin/booking"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
        <h1 className="text-2xl font-bold">{bookingPage.title || "Sans titre"}</h1>
        <p className="text-muted-foreground text-sm font-mono">
          /book/{bookingPage.slug}
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
          <TabsTrigger value="availability">Disponibilités</TabsTrigger>
          <TabsTrigger value="bookings">
            Réservations ({bookings.length})
          </TabsTrigger>
        </TabsList>

        {/* Onglet Paramètres */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuration de la page</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Infos principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Titre</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex : Appel découverte"
                    className="bg-[#141414] border-[#2A2A2A]"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Slug</Label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="bg-[#141414] border-[#2A2A2A]"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL : /book/{slug}
                  </p>
                </div>
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

              {/* Paramètres de créneau */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                  <Label>Jours disponibles</Label>
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

              {/* Couleur + Active */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Couleur de marque</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-12 h-10 p-1 bg-[#141414] border-[#2A2A2A] cursor-pointer"
                    />
                    <Input
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      placeholder="#C6FF00"
                      className="bg-[#141414] border-[#2A2A2A] font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Statut</Label>
                  <div className="flex items-center gap-3 h-10">
                    <Switch
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                    <span className="text-sm">
                      {isActive ? "Page active" : "Page inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Questions de qualification */}
              <div className="border-t border-[#2A2A2A] pt-6">
                <QualificationFieldEditor
                  fields={qualificationFields}
                  onChange={setQualificationFields}
                />
              </div>

              {/* Bouton sauvegarder */}
              <div className="flex justify-end pt-4 border-t border-[#2A2A2A]">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Disponibilités */}
        <TabsContent value="availability" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <AvailabilityEditor
                bookingPageId={bookingPage.id}
                availability={availability}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <ExceptionEditor
                bookingPageId={bookingPage.id}
                exceptions={exceptions}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Réservations */}
        <TabsContent value="bookings">
          <Card>
            <CardContent className="pt-6">
              <BookingsTable bookings={bookings} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
