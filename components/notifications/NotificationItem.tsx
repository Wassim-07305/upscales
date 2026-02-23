"use client";

import Link from "next/link";
import { MessageCircle, Newspaper, BookOpen, CalendarDays, Award, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Notification, NotificationType } from "@/lib/types/database";
import { timeAgo } from "@/lib/utils/dates";

const iconMap: Record<NotificationType, typeof MessageCircle> = {
  message: MessageCircle,
  post: Newspaper,
  formation: BookOpen,
  session: CalendarDays,
  certificate: Award,
  system: Info,
};

const colorMap: Record<NotificationType, string> = {
  message: "text-turquoise",
  post: "text-neon",
  formation: "text-primary",
  session: "text-[#FFB800]",
  certificate: "text-neon",
  system: "text-[#999999]",
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const Icon = iconMap[notification.type];

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
  };

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer",
        !notification.is_read && "bg-primary/5"
      )}
      onClick={handleClick}
    >
      <div className={cn("mt-0.5", colorMap[notification.type])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm", !notification.is_read && "font-medium")}>
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {notification.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {timeAgo(notification.created_at)}
        </p>
      </div>
      {!notification.is_read && (
        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
      )}
    </div>
  );

  if (notification.link) {
    return <Link href={notification.link}>{content}</Link>;
  }

  return content;
}
