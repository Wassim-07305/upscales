import { sendPushToUser, sendPushToUsers } from "@/lib/push";

const ICON_MAP: Record<string, string> = {
  message: "💬",
  post: "📝",
  formation: "📚",
  session: "📅",
  certificate: "🏆",
  system: "🔔",
};

/**
 * Send a push notification alongside an in-app notification.
 * Call this after inserting into the notifications table.
 * Fire-and-forget — never throws.
 */
export async function pushNotify(
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string | null
) {
  try {
    const icon = ICON_MAP[type] || "🔔";
    await sendPushToUser(userId, {
      title: `${icon} ${title}`,
      body: message,
      url: link || "/notifications",
      tag: type,
    });
  } catch {
    // Push is non-blocking
  }
}

/**
 * Send push notification to multiple users.
 */
export async function pushNotifyMany(
  userIds: string[],
  type: string,
  title: string,
  message: string,
  link?: string | null
) {
  try {
    const icon = ICON_MAP[type] || "🔔";
    await sendPushToUsers(userIds, {
      title: `${icon} ${title}`,
      body: message,
      url: link || "/notifications",
      tag: type,
    });
  } catch {
    // Push is non-blocking
  }
}
