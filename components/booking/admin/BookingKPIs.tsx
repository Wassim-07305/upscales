"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, CheckCircle, XCircle } from "lucide-react";
import { Booking } from "@/lib/types/database";

interface BookingKPIsProps {
  bookings: Booking[];
}

export function BookingKPIs({ bookings }: BookingKPIsProps) {
  const today = new Date().toISOString().split("T")[0];

  const total = bookings.length;
  const upcoming = bookings.filter(
    (b) => b.date >= today && b.status === "confirme"
  ).length;
  const completed = bookings.filter((b) => b.status === "realise").length;
  const noShow = bookings.filter((b) => b.status === "no_show").length;

  const stats = [
    {
      label: "Total réservations",
      value: total,
      icon: Calendar,
      color: "text-neon",
      bg: "bg-neon/10",
    },
    {
      label: "À venir",
      value: upcoming,
      icon: Clock,
      color: "text-turquoise",
      bg: "bg-turquoise/10",
    },
    {
      label: "Réalisés",
      value: completed,
      icon: CheckCircle,
      color: "text-neon",
      bg: "bg-neon/10",
    },
    {
      label: "No-show",
      value: noShow,
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className={`p-2 rounded-lg ${stat.bg} mb-2`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
