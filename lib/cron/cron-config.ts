import type { CronJob } from "./cron-types";

export const CRON_JOBS_CONFIG: Pick<CronJob, "id" | "name" | "description" | "schedule" | "schedule_human" | "endpoint">[] = [
  {
    id: "cleanup",
    name: "Nettoyage des donnees",
    description: "Supprime les sessions expirees et les logs anciens",
    schedule: "0 3 * * 0",
    schedule_human: "Dimanche a 3h",
    endpoint: "/api/cron/cleanup",
  },
  {
    id: "session-reminders",
    name: "Rappels de sessions",
    description: "Envoie des rappels avant les sessions planifiees",
    schedule: "0 * * * *",
    schedule_human: "Toutes les heures",
    endpoint: "/api/cron/session-reminders",
  },
  {
    id: "digest",
    name: "Digest hebdomadaire",
    description: "Envoie un resume des notifications non lues",
    schedule: "0 9 * * 1",
    schedule_human: "Lundi a 9h",
    endpoint: "/api/cron/digest",
  },
];
