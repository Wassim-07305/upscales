"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";
import type { FormField, FormSubmission } from "@/types/database";

interface WorkbookSubmissionViewProps {
  fields: FormField[];
  submission: FormSubmission;
}

const STATIC_TYPES = new Set([
  "step",
  "callout",
  "heading",
  "paragraph",
  "divider",
]);

export function WorkbookSubmissionView({
  fields,
  submission,
}: WorkbookSubmissionViewProps) {
  const sorted = [...fields].sort((a, b) => a.sort_order - b.sort_order);
  const answers = submission.answers as Record<string, unknown>;
  let stepNumber = 0;

  return (
    <div className="space-y-6">
      {sorted.map((field) => {
        if (
          field.field_type === "callout" ||
          field.field_type === "heading" ||
          field.field_type === "paragraph" ||
          field.field_type === "divider"
        )
          return null;

        if (field.field_type === "step") {
          stepNumber++;
          return (
            <div
              key={field.id}
              className="flex items-center gap-3 pt-4 first:pt-0"
            >
              <div className="w-8 h-8 rounded-full bg-[#c6ff00] text-white flex items-center justify-center text-sm font-bold shrink-0">
                {stepNumber}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {field.label}
                </h3>
                {field.description && (
                  <p className="text-xs text-muted-foreground">
                    {field.description}
                  </p>
                )}
              </div>
            </div>
          );
        }

        if (field.field_type === "checklist") {
          const checked = (answers[field.id] as string[]) ?? [];
          return (
            <div key={field.id} className="ml-11 bg-muted/30 rounded-xl p-4">
              <p className="text-xs font-medium text-foreground mb-2">
                {field.label}
              </p>
              <div className="space-y-1.5">
                {(field.options ?? []).map((opt) => {
                  const isChecked = checked.includes(opt.value);
                  return (
                    <div
                      key={opt.value}
                      className="flex items-center gap-2 text-sm"
                    >
                      {isChecked ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span
                        className={cn(
                          isChecked
                            ? "text-foreground"
                            : "text-muted-foreground line-through",
                        )}
                      >
                        {opt.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        const answer = answers[field.id];
        if (answer === undefined || answer === null || answer === "")
          return null;

        return (
          <div key={field.id} className="ml-11">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {field.label}
            </p>
            <p className="text-sm text-foreground bg-muted/30 rounded-xl px-4 py-3 whitespace-pre-wrap">
              {String(answer)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
