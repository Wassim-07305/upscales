"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronRight, Calendar } from "lucide-react";
import { Booking, BookingStatus } from "@/lib/types/database";
import { formatDate } from "@/lib/utils/dates";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BookingsTableProps {
  bookings: Booking[];
}

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; className: string }
> = {
  confirme: {
    label: "Confirmé",
    className: "bg-neon/20 text-neon border-neon/30",
  },
  realise: {
    label: "Réalisé",
    className: "bg-turquoise/20 text-turquoise border-turquoise/30",
  },
  annule: {
    label: "Annulé",
    className: "bg-muted text-muted-foreground border-border",
  },
  no_show: {
    label: "No-show",
    className: "bg-destructive/20 text-destructive border-destructive/30",
  },
};

export function BookingsTable({ bookings }: BookingsTableProps) {
  const router = useRouter();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function handleStatusChange(bookingId: string, newStatus: BookingStatus) {
    setUpdatingId(bookingId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;

      toast.success(`Statut mis à jour : ${STATUS_CONFIG[newStatus].label}`);
      router.refresh();
    } catch {
      toast.error("Erreur lors de la mise à jour du statut");
    } finally {
      setUpdatingId(null);
    }
  }

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Calendar className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">Aucune réservation</p>
        <p className="text-sm">Les réservations apparaîtront ici.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8" />
          <TableHead>Prospect</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Heure</TableHead>
          {bookings.some((b) => b.booking_page) && (
            <TableHead>Page</TableHead>
          )}
          <TableHead>Statut</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => {
          const isExpanded = expandedRow === booking.id;
          const hasAnswers =
            booking.qualification_answers &&
            Object.keys(booking.qualification_answers).length > 0;

          return (
            <>
              <TableRow key={booking.id}>
                <TableCell>
                  {hasAnswers && (
                    <button
                      onClick={() =>
                        setExpandedRow(isExpanded ? null : booking.id)
                      }
                      className="p-1 hover:bg-muted rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{booking.prospect_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.prospect_email}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{formatDate(booking.date)}</TableCell>
                <TableCell>
                  {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                </TableCell>
                {bookings.some((b) => b.booking_page) && (
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {booking.booking_page?.title || "—"}
                    </span>
                  </TableCell>
                )}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild disabled={updatingId === booking.id}>
                      <button className="focus:outline-none">
                        <Badge
                          variant="outline"
                          className={cn(
                            STATUS_CONFIG[booking.status].className,
                            "cursor-pointer hover:opacity-80 transition-opacity",
                            updatingId === booking.id && "opacity-50"
                          )}
                        >
                          {STATUS_CONFIG[booking.status].label}
                        </Badge>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {(Object.keys(STATUS_CONFIG) as BookingStatus[])
                        .filter((s) => s !== booking.status)
                        .map((status) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => handleStatusChange(booking.id, status)}
                          >
                            <Badge
                              variant="outline"
                              className={cn(
                                STATUS_CONFIG[status].className,
                                "mr-2"
                              )}
                            >
                              {STATUS_CONFIG[status].label}
                            </Badge>
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              {isExpanded && hasAnswers && (
                <TableRow key={`${booking.id}-details`}>
                  <TableCell
                    colSpan={bookings.some((b) => b.booking_page) ? 6 : 5}
                    className="bg-[#141414]"
                  >
                    <div className="py-2 px-4 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Réponses de qualification
                      </p>
                      {Object.entries(booking.qualification_answers).map(
                        ([key, value]) => (
                          <div key={key} className="flex gap-2 text-sm">
                            <span className="text-muted-foreground font-medium min-w-[140px]">
                              {key} :
                            </span>
                            <span>
                              {Array.isArray(value) ? value.join(", ") : value}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          );
        })}
      </TableBody>
    </Table>
  );
}
