"use client";

import Link from "next/link";
import { MessageCircle, Newspaper, BookOpen, CalendarDays, Award, Info, X } from "lucide-react";
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
  onDelete?: (id: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const Icon = iconMap[notification.type];

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(notification.id);
  };

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer group relative",
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
      <div className="flex items-center gap-2 flex-shrink-0">
        {!notification.is_read && (
          <div className="w-2 h-2 rounded-full bg-primary mt-2" />
        )}
        {onDelete && (
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
            title="Supprimer"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
          </button>
        )}
      </div>
    </div>
  );

  if (notification.link) {
    return <Link href={notification.link}>{content}</Link>;
  }

  return content;
}
