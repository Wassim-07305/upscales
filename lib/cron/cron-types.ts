export type CronJobStatus = "active" | "paused" | "error" | "running";

export interface CronJob {
  id: string;
  name: string;
  description: string;
  schedule: string;
  schedule_human: string;
  endpoint: string;
  status: CronJobStatus;
}

export interface CronRunLog {
  id: string;
  job_id: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  status: "success" | "error";
  error_message: string | null;
  items_processed: number;
}
