export type SubmissionStatus = "draft" | "submitted" | "pending" | "reviewed" | "revision_requested";

export interface ExerciseAttachment {
  name: string;
  url: string;
}

export interface ExerciseSubmission {
  id: string;
  lessonId: string;
  studentId: string;
  studentName: string;
  lessonTitle: string;
  content: string;
  attachments: ExerciseAttachment[];
  status: SubmissionStatus;
  coachFeedback: string | null;
  grade: number | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  submittedAt: string;
}
