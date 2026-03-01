"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Copy,
  Settings,
  Trash2,
  Clock,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { BookingPage, Booking } from "@/lib/types/database";
import { BookingKPIs } from "@/components/booking/admin/BookingKPIs";
import { BookingsTable } from "@/components/booking/admin/BookingsTable";
import { BookingPageFormDialog } from "@/components/booking/admin/BookingPageFormDialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BookingAdminClientProps {
  bookingPages: BookingPage[];
  recentBookings: Booking[];
}

export function BookingAdminClient({
  bookingPages,
  recentBookings,
}: BookingAdminClientProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleToggleActive(page: BookingPage) {
    setTogglingId(page.id);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("booking_pages")
        .update({ is_active: !page.is_active })
        .eq("id", page.id);

      if (error) throw error;

      toast.success(
        page.is_active ? "Page désactivée" : "Page activée"
      );
      router.refresh();
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(pageId: string) {
    if (!confirm("Supprimer cette page de réservation ? Cette action est irréversible.")) {
      return;
    }

    setDeletingId(pageId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("booking_pages")
        .delete()
        .eq("id", pageId);

      if (error) throw error;

      toast.success("Page supprimée");
      router.refresh();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  }

  function copyUrl(slug: string) {
    const url = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("URL copiée dans le presse-papier");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Réservations</h1>
          <p className="text-muted-foreground">
            Gérez vos pages de réservation et suivez les rendez-vous
          </p>
        </div>
        <BookingPageFormDialog />
      </div>

      {/* KPI Cards */}
      <BookingKPIs bookings={recentBookings} />

      {/* Tabs */}
      <Tabs defaultValue="pages">
        <TabsList>
          <TabsTrigger value="pages">
            Pages de réservation
          </TabsTrigger>
          <TabsTrigger value="bookings">
            Réservations
          </TabsTrigger>
        </TabsList>

        {/* Onglet Pages */}
        <TabsContent value="pages">
          {bookingPages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Calendar className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucune page de réservation</p>
              <p className="text-sm mb-4">
                Créez votre première page pour commencer à recevoir des réservations.
              </p>
              <BookingPageFormDialog />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookingPages.map((page) => (
                <Card
                  key={page.id}
                  className={cn(
                    "relative overflow-hidden transition-all",
                    !page.is_active && "opacity-60"
                  )}
                >
                  {/* Barre de couleur en haut */}
                  <div
                    className="h-1"
                    style={{ backgroundColor: page.brand_color }}
                  />
                  <CardContent className="pt-4 space-y-3">
                    {/* En-tête */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">
                          {page.title || "Sans titre"}
                        </h3>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs text-muted-foreground font-mono truncate">
                            /book/{page.slug}
                          </span>
                          <button
                            onClick={() => copyUrl(page.slug)}
                            className="p-0.5 hover:bg-muted rounded shrink-0"
                          >
                            <Copy className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 ml-2",
                          page.is_active
                            ? "bg-neon/20 text-neon border-neon/30"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {page.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    {/* Config */}
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 bg-[#1C1C1C] px-2 py-1 rounded">
                        <Clock className="h-3 w-3" />
                        {page.slot_duration} min
                      </span>
                      {page.buffer_minutes > 0 && (
                        <span className="bg-[#1C1C1C] px-2 py-1 rounded">
                          Buffer {page.buffer_minutes} min
                        </span>
                      )}
                      <span className="bg-[#1C1C1C] px-2 py-1 rounded">
                        {page.max_days_ahead}j max
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#2A2A2A]">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={page.is_active}
                          onCheckedChange={() => handleToggleActive(page)}
                          disabled={togglingId === page.id}
                          size="sm"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(page.id)}
                          disabled={deletingId === page.id}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <a
                            href={`/book/${page.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/booking/${page.id}`}>
                            <Settings className="h-4 w-4 mr-1" />
                            Gérer
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Onglet Réservations */}
        <TabsContent value="bookings">
          <Card>
            <CardContent className="pt-6">
              <BookingsTable bookings={recentBookings} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
