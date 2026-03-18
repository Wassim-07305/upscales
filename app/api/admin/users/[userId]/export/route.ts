import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/utils/roles";

type Row = Record<string, unknown>;

interface UserDataBundle {
  exportedAt: string;
  userId: string;
  profile: Row;
  enrollments: Row[];
  moduleProgress: Row[];
  quizAttempts: Row[];
  certificates: Row[];
  posts: Row[];
  comments: Row[];
  postLikes: Row[];
  commentLikes: Row[];
  messages: Row[];
  notifications: Row[];
  bookings: Row[];
  crmNotes: Row[];
  auditLogs: Row[];
  warnings: Row[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const format = request.nextUrl.searchParams.get("format") ?? "json";

  // Auth check — require admin role
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!adminProfile || !isAdmin(adminProfile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Use service role client to bypass RLS for all tables
  const admin = createAdminClient();

  // Fetch the target user's profile first (needed for bookings lookup by email)
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Aggregate all user data in parallel
  const [
    { data: enrollments },
    { data: moduleProgress },
    { data: quizAttempts },
    { data: certificates },
    { data: posts },
    { data: comments },
    { data: postLikes },
    { data: commentLikes },
    { data: messages },
    { data: notifications },
    { data: bookings },
    { data: crmNotes },
    { data: auditLogs },
    { data: warnings },
  ] = await Promise.all([
    admin.from("formation_enrollments").select("*").eq("user_id", userId),
    admin.from("module_progress").select("*").eq("user_id", userId),
    admin.from("quiz_attempts").select("*").eq("user_id", userId),
    admin.from("certificates").select("*").eq("user_id", userId),
    admin.from("posts").select("*").eq("author_id", userId),
    admin.from("comments").select("*").eq("author_id", userId),
    admin.from("post_likes").select("*").eq("user_id", userId),
    admin.from("comment_likes").select("*").eq("user_id", userId),
    admin.from("messages").select("*").eq("sender_id", userId),
    admin.from("notifications").select("*").eq("user_id", userId),
    admin.from("bookings").select("*").eq("prospect_email", profile.email),
    admin.from("crm_notes").select("*").eq("student_id", userId),
    admin.from("audit_logs").select("*").eq("actor_id", userId),
    admin.from("user_warnings").select("*").eq("user_id", userId),
  ]);

  const exportDate = new Date().toISOString().slice(0, 10);

  const bundle: UserDataBundle = {
    exportedAt: new Date().toISOString(),
    userId,
    profile: profile as Row,
    enrollments: (enrollments ?? []) as Row[],
    moduleProgress: (moduleProgress ?? []) as Row[],
    quizAttempts: (quizAttempts ?? []) as Row[],
    certificates: (certificates ?? []) as Row[],
    posts: (posts ?? []) as Row[],
    comments: (comments ?? []) as Row[],
    postLikes: (postLikes ?? []) as Row[],
    commentLikes: (commentLikes ?? []) as Row[],
    messages: (messages ?? []) as Row[],
    notifications: (notifications ?? []) as Row[],
    bookings: (bookings ?? []) as Row[],
    crmNotes: (crmNotes ?? []) as Row[],
    auditLogs: (auditLogs ?? []) as Row[],
    warnings: (warnings ?? []) as Row[],
  };

  if (format === "csv") {
    const csv = buildCsv(bundle);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="export-${userId}-${exportDate}.csv"`,
      },
    });
  }

  return new NextResponse(JSON.stringify(bundle, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="export-${userId}-${exportDate}.json"`,
    },
  });
}

function toCsvRows(records: Row[]): string {
  if (!records || records.length === 0) return "(aucune donnée)\n";
  const headers = Object.keys(records[0]);
  const rows = records.map((r) =>
    headers
      .map((h) => {
        const val = r[h];
        if (val === null || val === undefined) return "";
        const str =
          typeof val === "object" ? JSON.stringify(val) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n") + "\n";
}

function section(title: string, records: Row[]): string {
  return `=== ${title} ===\n${toCsvRows(records)}\n`;
}

function buildCsv(b: UserDataBundle): string {
  return (
    section("PROFIL", [b.profile]) +
    section("INSCRIPTIONS", b.enrollments) +
    section("PROGRESSION MODULES", b.moduleProgress) +
    section("TENTATIVES QUIZ", b.quizAttempts) +
    section("CERTIFICATS", b.certificates) +
    section("POSTS", b.posts) +
    section("COMMENTAIRES", b.comments) +
    section("LIKES POSTS", b.postLikes) +
    section("LIKES COMMENTAIRES", b.commentLikes) +
    section("MESSAGES", b.messages) +
    section("NOTIFICATIONS", b.notifications) +
    section("RÉSERVATIONS", b.bookings) +
    section("NOTES CRM", b.crmNotes) +
    section("LOGS D'AUDIT", b.auditLogs) +
    section("AVERTISSEMENTS", b.warnings)
  );
}
