import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callGroq } from "@/lib/groq";

const REPORT_SYSTEM_PROMPT = `Tu es l'assistant IA de la plateforme UPSCALE. Tu generes un rapport periodique de coaching.

Regles strictes :
- Réponses en francais, tu tutoies.
- Pas d'emojis.
- Utilise le format Markdown : titres (##), listes (-), **gras**.
- Sois concis et actionnable. Maximum 400 mots.
- Structure : Resume general, Points forts, Points d'attention, Actions recommandees.
- Base ton analyse uniquement sur les donnees fournies.`;

const PERFORMANCE_SYSTEM_PROMPT = `Tu es l'assistant IA de la plateforme UPSCALE. Tu generes un rapport de performance mensuel.

Regles strictes :
- Réponses en francais, tu tutoies.
- Pas d'emojis.
- Utilise le format Markdown : titres (##), listes (-), **gras**.
- Sois concis et actionnable. Maximum 500 mots.
- Structure : Synthese du mois, Revenus et conversions, Engagement clients, Axes d'amelioration.
- Base ton analyse uniquement sur les donnees fournies.`;

const RISK_SYSTEM_PROMPT = `Tu es l'assistant IA de la plateforme UPSCALE. Tu identifies les clients à risque.

Regles strictes :
- Réponses en francais, tu tutoies.
- Pas d'emojis.
- Utilise le format Markdown : titres (##), listes (-), **gras**.
- Sois concis. Maximum 400 mots.
- Structure : Nombre de clients à risque, Liste detaillee (nom + raisons), Actions recommandees.
- Base ton analyse uniquement sur les donnees fournies.`;

type ReportType = "weekly_coaching" | "monthly_performance" | "client_risk";

/**
 * GET: generate a report for the authenticated user (legacy)
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "coach"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Acces reserve aux coaches et admins" },
        { status: 403 },
      );
    }

    const result = await generateWeeklyReport(supabase, profile, user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("AI periodic report error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la generation du rapport IA" },
      { status: 500 },
    );
  }
}

/**
 * POST: cron endpoint to generate and store reports.
 * Auth via CRON_SECRET Bearer token.
 * Body: { type: ReportType, userId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate via CRON_SECRET
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const body = await request.json();
    const reportType = (body.type as ReportType) ?? "weekly_coaching";
    const targetUserId = body.userId as string | undefined;

    const supabase = await createClient();

    // Get target users (admin + coach)
    let usersQuery = supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("role", ["admin", "coach"]);

    if (targetUserId) {
      usersQuery = usersQuery.eq("id", targetUserId);
    }

    const { data: users } = await usersQuery;

    if (!users || users.length === 0) {
      return NextResponse.json({ message: "Aucun utilisateur cible" });
    }

    const results: { userId: string; success: boolean; error?: string }[] = [];

    for (const userProfile of users) {
      try {
        let result: {
          report: string;
          title: string;
          data: Record<string, unknown>;
        };

        switch (reportType) {
          case "monthly_performance":
            result = await generatePerformanceReport(supabase, userProfile);
            break;
          case "client_risk":
            result = await generateRiskReport(supabase, userProfile);
            break;
          default:
            result = await generateWeeklyReport(supabase, userProfile);
        }

        // Store in ai_reports table
        await supabase.from("ai_reports" as never).insert({
          user_id: userProfile.id,
          type: reportType,
          title: result.title,
          content: result.report,
          data: result.data,
          generated_at: new Date().toISOString(),
        } as never);

        results.push({ userId: userProfile.id, success: true });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
        results.push({
          userId: userProfile.id,
          success: false,
          error: errorMsg,
        });
      }
    }

    return NextResponse.json({ generated: results.length, results });
  } catch (error) {
    console.error("AI periodic report cron error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la generation des rapports" },
      { status: 500 },
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateWeeklyReport(
  supabase: any,
  profile: { id?: string; full_name: string; role: string },
  userId?: string,
) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

  // For coaches, get assigned client IDs to scope all queries
  let assignedIds: string[] | null = null;
  if (profile.role === "coach" && userId) {
    const { data: assignments } = await supabase
      .from("coach_assignments")
      .select("client_id")
      .eq("coach_id", userId)
      .eq("status", "active");
    assignedIds = (assignments ?? []).map(
      (a: { client_id: string }) => a.client_id,
    );
  }

  // Build scoped queries
  let journalQuery = supabase
    .from("journal_entries")
    .select("title, mood, tags, created_at")
    .gte("created_at", sevenDaysAgo)
    .order("created_at", { ascending: false })
    .limit(50);
  if (assignedIds) journalQuery = journalQuery.in("user_id", assignedIds);

  let checkinsQuery = supabase
    .from("weekly_checkins")
    .select("mood, energy, goals_progress, blockers, wins, created_at")
    .gte("created_at", sevenDaysAgo)
    .order("created_at", { ascending: false })
    .limit(30);
  if (assignedIds) checkinsQuery = checkinsQuery.in("user_id", assignedIds);

  let messagesQuery = supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo);
  if (assignedIds) messagesQuery = messagesQuery.in("sender_id", assignedIds);

  let sessionsQuery = supabase
    .from("coaching_sessions")
    .select("title, status, created_at")
    .gte("created_at", sevenDaysAgo)
    .limit(20);
  if (assignedIds && userId)
    sessionsQuery = sessionsQuery.eq("coach_id", userId);

  let callsQuery = supabase
    .from("call_calendar")
    .select("title, call_type, status, date")
    .gte("date", sevenDaysAgo.split("T")[0])
    .limit(20);
  if (userId && profile.role === "coach")
    callsQuery = callsQuery.eq("assigned_to", userId);

  let studentsQuery = supabase
    .from("profiles")
    .select("full_name, last_active_at")
    .in("role", ["client", "prospect"])
    .order("last_active_at", { ascending: false })
    .limit(50);
  if (assignedIds) studentsQuery = studentsQuery.in("id", assignedIds);

  // Donnees supplementaires pour enrichir le rapport
  const invoicesQuery = supabase
    .from("invoices")
    .select("total, status, created_at")
    .gte("created_at", sevenDaysAgo)
    .not("status", "in", '("draft","cancelled")');

  const goalsQuery = supabase
    .from("coaching_goals")
    .select("title, status, current_value, target_value")
    .limit(20);

  const pipelineQuery = supabase
    .from("crm_contacts")
    .select("stage")
    .gte("created_at", sevenDaysAgo);

  const dailyCheckinsQuery = supabase
    .from("daily_checkins")
    .select("energy, mood, wins, learnings, goal_today")
    .gte("created_at", sevenDaysAgo)
    .limit(30);

  const xpQuery = supabase
    .from("xp_transactions")
    .select("xp_amount, action")
    .gte("created_at", sevenDaysAgo);

  const feedQuery = supabase
    .from("feed_posts")
    .select("id", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo);

  const [
    journalRes,
    checkinsRes,
    messagesRes,
    sessionsRes,
    callsRes,
    studentsRes,
    invoicesRes,
    goalsRes,
    pipelineRes,
    dailyCheckinsRes,
    xpRes,
    feedRes,
  ] = await Promise.all([
    journalQuery,
    checkinsQuery,
    messagesQuery,
    sessionsQuery,
    callsQuery,
    studentsQuery,
    invoicesQuery,
    goalsQuery,
    pipelineQuery,
    dailyCheckinsQuery,
    xpQuery,
    feedQuery,
  ]);

  const journalEntries = journalRes.data ?? [];
  const checkins = checkinsRes.data ?? [];
  const sessions = sessionsRes.data ?? [];
  const calls = callsRes.data ?? [];
  const students = studentsRes.data ?? [];

  let context = `## Donnees des 7 derniers jours (${new Date(sevenDaysAgo).toLocaleDateString("fr-FR")} - ${now.toLocaleDateString("fr-FR")})\n\n`;

  // Journal
  context += `### Journal (${journalEntries.length} entrees)\n`;
  if (journalEntries.length > 0) {
    const moods: Record<string, number> = {};
    journalEntries.forEach((e: Record<string, unknown>) => {
      const mood = (e.mood as string) ?? "non_renseigne";
      moods[mood] = (moods[mood] ?? 0) + 1;
    });
    context += `Repartition des humeurs : ${Object.entries(moods)
      .map(([m, c]) => `${m} (${c})`)
      .join(", ")}\n`;
    context += `Themes abordes : ${
      [
        ...new Set(
          journalEntries.flatMap(
            (e: Record<string, unknown>) => (e.tags as string[]) ?? [],
          ),
        ),
      ].join(", ") || "aucun"
    }\n`;
  }

  // Check-ins
  context += `\n### Check-ins (${checkins.length})\n`;
  if (checkins.length > 0) {
    const avgEnergy =
      checkins.reduce(
        (s: number, c: Record<string, unknown>) => s + (Number(c.energy) || 0),
        0,
      ) / checkins.length;
    const avgProgress =
      checkins.reduce(
        (s: number, c: Record<string, unknown>) =>
          s + (Number(c.goals_progress) || 0),
        0,
      ) / checkins.length;
    context += `Energie moyenne : ${avgEnergy.toFixed(1)}/10\n`;
    context += `Progression objectifs moyenne : ${avgProgress.toFixed(0)}%\n`;

    const allWins = checkins
      .filter((c: Record<string, unknown>) => c.wins)
      .map((c: Record<string, unknown>) => c.wins as string);
    if (allWins.length > 0) {
      context += `Victoires : ${allWins.slice(0, 5).join("; ")}\n`;
    }

    const allBlockers = checkins
      .filter((c: Record<string, unknown>) => c.blockers)
      .map((c: Record<string, unknown>) => c.blockers as string);
    if (allBlockers.length > 0) {
      context += `Blocages : ${allBlockers.slice(0, 5).join("; ")}\n`;
    }
  }

  context += `\n### Activite messagerie\n`;
  context += `Messages envoyes : ${messagesRes.count ?? 0}\n`;

  context += `\n### Sessions coaching (${sessions.length})\n`;
  if (sessions.length > 0) {
    const completed = sessions.filter(
      (s: Record<string, unknown>) => s.status === "completed",
    ).length;
    context += `Completees : ${completed}/${sessions.length}\n`;
  }

  context += `\n### Appels (${calls.length})\n`;
  if (calls.length > 0) {
    const byType: Record<string, number> = {};
    calls.forEach((c: Record<string, unknown>) => {
      const t = (c.call_type as string) ?? "autre";
      byType[t] = (byType[t] ?? 0) + 1;
    });
    context += `Par type : ${Object.entries(byType)
      .map(([t, c]) => `${t} (${c})`)
      .join(", ")}\n`;
  }

  const activeStudents = students.filter((s: Record<string, unknown>) => {
    if (!s.last_active_at) return false;
    return (
      new Date(s.last_active_at as string).getTime() >
      now.getTime() - 7 * 86400000
    );
  });
  const inactiveStudents = students.filter((s: Record<string, unknown>) => {
    if (!s.last_active_at) return true;
    return (
      new Date(s.last_active_at as string).getTime() <=
      now.getTime() - 7 * 86400000
    );
  });

  context += `\n### Eleves\n`;
  context += `Actifs cette semaine : ${activeStudents.length}\n`;
  context += `Inactifs : ${inactiveStudents.length}\n`;
  if (inactiveStudents.length > 0) {
    context += `Inactifs notables : ${inactiveStudents
      .slice(0, 5)
      .map((s: Record<string, unknown>) => s.full_name)
      .join(", ")}\n`;
  }

  // Finances
  const invoices = invoicesRes.data ?? [];
  const totalInvoiced = invoices.reduce(
    (s: number, i: Record<string, unknown>) => s + Number(i.total ?? 0),
    0,
  );
  const totalCollected = invoices
    .filter((i: Record<string, unknown>) => i.status === "paid")
    .reduce(
      (s: number, i: Record<string, unknown>) => s + Number(i.total ?? 0),
      0,
    );
  const overdueCount = invoices.filter(
    (i: Record<string, unknown>) => i.status === "overdue",
  ).length;
  context += `\n### Finances (7 derniers jours)\n`;
  context += `CA facture : ${totalInvoiced} EUR\n`;
  context += `Cash collecte : ${totalCollected} EUR\n`;
  context += `Taux de recouvrement : ${totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0}%\n`;
  context += `Factures en retard : ${overdueCount}\n`;

  // Objectifs coaching
  const goals = goalsRes.data ?? [];
  if (goals.length > 0) {
    context += `\n### Objectifs coaching (${goals.length})\n`;
    goals.forEach((g: Record<string, unknown>) => {
      context += `- ${g.title} : ${g.status} (${g.current_value ?? 0}/${g.target_value ?? "?"})\n`;
    });
  }

  // Pipeline CRM
  const pipelineContacts = pipelineRes.data ?? [];
  if (pipelineContacts.length > 0) {
    const byStage: Record<string, number> = {};
    pipelineContacts.forEach((c: Record<string, unknown>) => {
      const stage = (c.stage as string) ?? "inconnu";
      byStage[stage] = (byStage[stage] ?? 0) + 1;
    });
    context += `\n### Pipeline CRM (nouveaux contacts cette semaine)\n`;
    context +=
      Object.entries(byStage)
        .map(([s, c]) => `${s} : ${c}`)
        .join(", ") + "\n";
  }

  // Daily check-ins
  const dailyCheckins = dailyCheckinsRes.data ?? [];
  if (dailyCheckins.length > 0) {
    const avgMood =
      dailyCheckins.reduce(
        (s: number, c: Record<string, unknown>) => s + (Number(c.mood) || 0),
        0,
      ) / dailyCheckins.length;
    const avgEnergy2 =
      dailyCheckins.reduce(
        (s: number, c: Record<string, unknown>) => s + (Number(c.energy) || 0),
        0,
      ) / dailyCheckins.length;
    const wins = dailyCheckins
      .filter((c: Record<string, unknown>) => c.wins)
      .map((c: Record<string, unknown>) => c.wins as string);
    context += `\n### Check-ins quotidiens (${dailyCheckins.length})\n`;
    context += `Mood moyen : ${avgMood.toFixed(1)}/5\n`;
    context += `Energie moyenne : ${avgEnergy2.toFixed(1)}/5\n`;
    if (wins.length > 0) {
      context += `Dernieres victoires : ${wins.slice(0, 5).join("; ")}\n`;
    }
  }

  // Gamification
  const xpTransactions = xpRes.data ?? [];
  if (xpTransactions.length > 0) {
    const totalXp = xpTransactions.reduce(
      (s: number, t: Record<string, unknown>) => s + (Number(t.xp_amount) || 0),
      0,
    );
    context += `\n### Gamification\n`;
    context += `XP gagnes cette semaine : ${totalXp}\n`;
    context += `Transactions : ${xpTransactions.length}\n`;
  }

  // Feed
  context += `\n### Communaute\n`;
  context += `Posts publies cette semaine : ${feedRes.count ?? 0}\n`;

  const result = await callGroq({
    system: REPORT_SYSTEM_PROMPT,
    maxTokens: 1024,
    messages: [
      {
        role: "user",
        content: `Genere un rapport hebdomadaire de coaching pour ${profile.full_name} (role: ${profile.role}).\n\n${context}`,
      },
    ],
  });

  const title = `Rapport coaching - Semaine du ${new Date(sevenDaysAgo).toLocaleDateString("fr-FR")}`;

  return {
    report: result.text,
    title,
    period: { start: sevenDaysAgo, end: now.toISOString() },
    stats: {
      journalEntries: journalEntries.length,
      checkins: checkins.length,
      messages: messagesRes.count ?? 0,
      sessions: sessions.length,
      calls: calls.length,
      activeStudents: activeStudents.length,
      inactiveStudents: inactiveStudents.length,
    },
    data: {
      period: { start: sevenDaysAgo, end: now.toISOString() },
      stats: {
        journalEntries: journalEntries.length,
        checkins: checkins.length,
        messages: messagesRes.count ?? 0,
        sessions: sessions.length,
        calls: calls.length,
        activeStudents: activeStudents.length,
        inactiveStudents: inactiveStudents.length,
      },
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generatePerformanceReport(
  supabase: any,
  profile: { id?: string; full_name: string; role: string },
) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

  const [revenueRes, leadsRes, callsRes, clientsRes] = await Promise.all([
    supabase
      .from("financial_entries")
      .select("amount, type, created_at")
      .gte("created_at", thirtyDaysAgo)
      .limit(100),
    supabase
      .from("leads")
      .select("status, created_at")
      .gte("created_at", thirtyDaysAgo)
      .limit(200),
    supabase
      .from("call_calendar")
      .select("status, call_type, date")
      .gte("date", thirtyDaysAgo.split("T")[0])
      .limit(100),
    supabase
      .from("profiles")
      .select("id, role, created_at")
      .eq("role", "client")
      .limit(200),
  ]);

  const revenue = revenueRes.data ?? [];
  const leads = leadsRes.data ?? [];
  const calls = callsRes.data ?? [];
  const clients = clientsRes.data ?? [];

  const totalRevenue = revenue
    .filter((r: Record<string, unknown>) => r.type === "revenue")
    .reduce(
      (s: number, r: Record<string, unknown>) => s + (Number(r.amount) || 0),
      0,
    );

  const closedLeads = leads.filter(
    (l: Record<string, unknown>) => l.status === "close",
  ).length;
  const conversionRate =
    leads.length > 0 ? ((closedLeads / leads.length) * 100).toFixed(1) : "0";

  let context = `## Performance des 30 derniers jours\n\n`;
  context += `Revenus totaux : ${totalRevenue} EUR\n`;
  context += `Leads : ${leads.length} (convertis : ${closedLeads}, taux : ${conversionRate}%)\n`;
  context += `Appels : ${calls.length}\n`;
  context += `Clients actifs : ${clients.length}\n`;

  const result = await callGroq({
    system: PERFORMANCE_SYSTEM_PROMPT,
    maxTokens: 1200,
    messages: [
      {
        role: "user",
        content: `Genere un rapport de performance mensuel pour ${profile.full_name} (role: ${profile.role}).\n\n${context}`,
      },
    ],
  });

  return {
    report: result.text,
    title: `Performance - ${now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`,
    data: {
      totalRevenue,
      leads: leads.length,
      closedLeads,
      conversionRate: Number(conversionRate),
      calls: calls.length,
      clients: clients.length,
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateRiskReport(
  supabase: any,
  profile: { id?: string; full_name: string; role: string },
) {
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000).toISOString();

  const { data: students } = await supabase
    .from("student_details")
    .select(
      "profile_id, tag, flag, engagement_score, health_score, last_engagement_at, profiles!student_details_profile_id_fkey(full_name)",
    )
    .in("tag", ["at_risk", "churned"])
    .order("health_score", { ascending: true })
    .limit(30);

  const { data: inactiveStudents } = await supabase
    .from("profiles")
    .select("id, full_name, last_seen_at")
    .eq("role", "client")
    .lt("last_seen_at", fourteenDaysAgo)
    .order("last_seen_at", { ascending: true })
    .limit(20);

  const atRisk = students ?? [];
  const inactive = inactiveStudents ?? [];

  let context = `## Clients à risque\n\n`;
  context += `### Clients tagges à risque (${atRisk.length})\n`;
  atRisk.forEach((s: Record<string, unknown>) => {
    const profiles = s.profiles as Record<string, unknown> | null;
    const name = profiles?.full_name ?? "Inconnu";
    context += `- ${name} : flag=${s.flag}, score engagement=${s.engagement_score}, sante=${s.health_score}\n`;
  });

  context += `\n### Clients inactifs >14j (${inactive.length})\n`;
  inactive.forEach((s: Record<string, unknown>) => {
    context += `- ${s.full_name} : derniere connexion ${s.last_seen_at ?? "jamais"}\n`;
  });

  const result = await callGroq({
    system: RISK_SYSTEM_PROMPT,
    maxTokens: 1024,
    messages: [
      {
        role: "user",
        content: `Genere un rapport de risque client pour ${profile.full_name} (role: ${profile.role}).\n\n${context}`,
      },
    ],
  });

  return {
    report: result.text,
    title: `Alerte risque clients - ${now.toLocaleDateString("fr-FR")}`,
    data: {
      atRiskCount: atRisk.length,
      inactiveCount: inactive.length,
    },
  };
}
