# Workbooks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add workbook support to the existing form system — a workbook is a form with `type: 'workbook'`, 3 new field types (step, callout, checklist), and a scrollable public renderer.

**Architecture:** Extend the existing forms system by adding a `type` column to `forms`, 3 new field_types to `form_fields`, workbook-specific field editors in the builder, and a dedicated scrollable renderer for public workbook pages. No new tables — submissions reuse `form_submissions`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase (PostgreSQL), Zustand, TanStack React Query, Tailwind CSS 4, Framer Motion, @dnd-kit.

---

### Task 1: Database Migration — Add `type` column to `forms`

**Files:**

- Create: `supabase/migrations/20260401120000_add_workbook_type.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Ajouter le type de formulaire (form ou workbook)
ALTER TABLE forms ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'form';

-- Contrainte pour les valeurs autorisees
ALTER TABLE forms ADD CONSTRAINT forms_type_check CHECK (type IN ('form', 'workbook'));
```

- [ ] **Step 2: Apply the migration**

Run: `source .env.local && /opt/homebrew/Cellar/postgresql@18/18.3/bin/psql "$DATABASE_URL" -f supabase/migrations/20260401120000_add_workbook_type.sql`
Expected: `ALTER TABLE` x2

- [ ] **Step 3: Verify**

Run: `source .env.local && /opt/homebrew/Cellar/postgresql@18/18.3/bin/psql "$DATABASE_URL" -c "\d forms" | grep type`
Expected: `type | text | not null | 'form'`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260401120000_add_workbook_type.sql
git commit -m "feat(db): add type column to forms for workbook support"
```

---

### Task 2: Update TypeScript Types & Constants

**Files:**

- Modify: `src/types/database.ts`
- Modify: `src/lib/constants.ts`
- Modify: `src/stores/form-builder-store.ts`

- [ ] **Step 1: Add `type` to Form interface in `src/types/database.ts`**

Find the `Form` interface and add `type` after `status`:

```typescript
// In the Form interface, add after status line:
type: "form" | "workbook";
```

- [ ] **Step 2: Add 3 new field types to `src/lib/constants.ts`**

Add these entries at the end of the `FORM_FIELD_TYPES` array, before the `] as const;`:

```typescript
  { value: "step", label: "Etape", icon: "ListOrdered" },
  { value: "callout", label: "Callout", icon: "AlertCircle" },
  { value: "checklist", label: "Checklist", icon: "CheckSquare2" },
```

- [ ] **Step 3: Add `type` to Zustand store in `src/stores/form-builder-store.ts`**

Add `type` to the state interface after `status`:

```typescript
// In FormBuilderState interface, add after setStatus line:
  type: "form" | "workbook";
  setType: (type: "form" | "workbook") => void;
```

Add to the `create()` implementation:

```typescript
// After setStatus implementation:
  type: "form",
  setType: (type) => set({ type }),
```

Update `reset()` to include `type: "form"`.

Update `loadForm()` parameter type to include `type?: string` and set it:

```typescript
  loadForm: (form) =>
    set({
      title: form.title,
      description: form.description ?? "",
      status: (form.status as "draft" | "active" | "closed" | "archived") ?? "draft",
      type: (form.type as "form" | "workbook") ?? "form",
      // ... rest unchanged
    }),
```

Also update the `loadForm` parameter type:

```typescript
  loadForm: (form: {
    title: string;
    description: string | null;
    status: string;
    type?: string;
    form_fields: FormField[];
  }) => void;
```

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -E "database\.ts|constants\.ts|form-builder-store" | head -10`
Expected: No errors (or only pre-existing ones)

- [ ] **Step 5: Commit**

```bash
git add src/types/database.ts src/lib/constants.ts src/stores/form-builder-store.ts
git commit -m "feat: add workbook type to Form interface, constants, and builder store"
```

---

### Task 3: Workbook Field Editors for Builder

**Files:**

- Create: `src/components/forms/workbook-field-editors.tsx`

- [ ] **Step 1: Create the workbook field editors component**

This file exports 3 editor components used in the builder sidebar when editing step/callout/checklist fields.

```tsx
"use client";

import {
  useFormBuilderStore,
  type BuilderField,
} from "@/stores/form-builder-store";
import { Plus, Trash2 } from "lucide-react";

// Editeur pour le champ "step" (etape du workbook)
export function StepFieldEditor({ field }: { field: BuilderField }) {
  const updateField = useFormBuilderStore((s) => s.updateField);

  const content =
    (field.options as unknown as { content?: string })?.content ?? "";

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Titre de l'etape
        </label>
        <input
          value={field.label}
          onChange={(e) => updateField(field.id, { label: e.target.value })}
          className="w-full h-9 px-3 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Ex: Identifier une frustration majeure"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Sous-titre
        </label>
        <input
          value={field.description}
          onChange={(e) =>
            updateField(field.id, { description: e.target.value })
          }
          className="w-full h-9 px-3 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Ex: La base de ton marche UPSCALE"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Contenu explicatif
        </label>
        <textarea
          value={content}
          onChange={(e) =>
            updateField(field.id, {
              options: {
                content: e.target.value,
              } as unknown as BuilderField["options"],
            })
          }
          rows={6}
          className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          placeholder="Texte explicatif affiche sous le titre de l'etape..."
        />
      </div>
    </div>
  );
}

// Editeur pour le champ "callout" (bloc encadre lecture seule)
const CALLOUT_VARIANTS = [
  { value: "warning", label: "Alerte (rouge)" },
  { value: "info", label: "Info (bleu)" },
  { value: "tip", label: "Conseil (gris)" },
] as const;

export function CalloutFieldEditor({ field }: { field: BuilderField }) {
  const updateField = useFormBuilderStore((s) => s.updateField);

  const variant =
    (field.options as unknown as { variant?: string })?.variant ?? "warning";

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Titre du callout
        </label>
        <input
          value={field.label}
          onChange={(e) => updateField(field.id, { label: e.target.value })}
          className="w-full h-9 px-3 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Ex: Pourquoi c'est essentiel ?"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Contenu
        </label>
        <textarea
          value={field.description}
          onChange={(e) =>
            updateField(field.id, { description: e.target.value })
          }
          rows={4}
          className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          placeholder="Contenu du bloc callout..."
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Variante
        </label>
        <select
          value={variant}
          onChange={(e) =>
            updateField(field.id, {
              options: {
                variant: e.target.value,
              } as unknown as BuilderField["options"],
            })
          }
          className="w-full h-9 px-3 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {CALLOUT_VARIANTS.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// Editeur pour le champ "checklist" (mini-checklist de validation)
export function ChecklistFieldEditor({ field }: { field: BuilderField }) {
  const updateField = useFormBuilderStore((s) => s.updateField);

  const items = field.options ?? [];

  const addItem = () => {
    const newItems = [
      ...items,
      { label: "", value: `item_${items.length + 1}` },
    ];
    updateField(field.id, { options: newItems });
  };

  const updateItem = (index: number, label: string) => {
    const newItems = items.map((item, i) =>
      i === index ? { ...item, label } : item,
    );
    updateField(field.id, { options: newItems });
  };

  const removeItem = (index: number) => {
    updateField(field.id, { options: items.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Titre de la checklist
        </label>
        <input
          value={field.label}
          onChange={(e) => updateField(field.id, { label: e.target.value })}
          className="w-full h-9 px-3 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Ex: Mini-checklist de validation"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Items
        </label>
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={item.value} className="flex items-center gap-2">
              <input
                value={item.label}
                onChange={(e) => updateItem(i, e.target.value)}
                className="flex-1 h-8 px-2.5 bg-muted border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder={`Item ${i + 1}...`}
              />
              <button
                onClick={() => removeItem(i)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            onClick={addItem}
            className="w-full h-8 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3 h-3" />
            Ajouter un item
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/forms/workbook-field-editors.tsx
git commit -m "feat: add workbook field editors (step, callout, checklist)"
```

---

### Task 4: Update Form Builder — Workbook Category & Editors

**Files:**

- Modify: `src/app/_shared-pages/forms/builder/page.tsx`

- [ ] **Step 1: Add imports for new components and icons**

At the top of the file, add to imports:

```typescript
import { ListOrdered, AlertCircle, CheckSquare2 } from "lucide-react";
import {
  StepFieldEditor,
  CalloutFieldEditor,
  ChecklistFieldEditor,
} from "@/components/forms/workbook-field-editors";
```

- [ ] **Step 2: Add workbook field category**

Find the `FIELD_CATEGORIES` array. After it, add:

```typescript
const WORKBOOK_FIELD_CATEGORY = {
  label: "Structure Workbook",
  icon: ListOrdered,
  types: ["step", "callout", "checklist"],
};
```

- [ ] **Step 3: Add workbook icons to the FIELD_ICONS map**

Find the `FIELD_ICONS` mapping object (maps field_type to icon component). Add these entries:

```typescript
  step: ListOrdered,
  callout: AlertCircle,
  checklist: CheckSquare2,
```

- [ ] **Step 4: Show workbook category when type is "workbook"**

Find where `FIELD_CATEGORIES` is mapped in the sidebar to render field type buttons. After that mapping, add a conditional block:

```tsx
{
  store.type === "workbook" && (
    <div>
      <div className="flex items-center gap-2 px-1 mb-2 mt-4">
        <WORKBOOK_FIELD_CATEGORY.icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          {WORKBOOK_FIELD_CATEGORY.label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {WORKBOOK_FIELD_CATEGORY.types.map((type) => {
          const Icon = FIELD_ICONS[type] ?? FileText;
          const label =
            FORM_FIELD_TYPES.find((t) => t.value === type)?.label ?? type;
          return (
            <button
              key={type}
              onClick={() => handleAddField(type)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all border border-transparent hover:border-border"
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Add workbook field editors to the field config panel**

Find the section where the selected field's editor is rendered (the right panel with label, description, placeholder, required, options, etc.). Add before the closing of that section:

```tsx
{
  /* Workbook-specific editors */
}
{
  selectedField?.field_type === "step" && (
    <StepFieldEditor field={selectedField} />
  );
}
{
  selectedField?.field_type === "callout" && (
    <CalloutFieldEditor field={selectedField} />
  );
}
{
  selectedField?.field_type === "checklist" && (
    <ChecklistFieldEditor field={selectedField} />
  );
}
```

For step and callout, hide the default label/description/placeholder/required editors since the workbook editors handle them. Wrap the existing editors:

```tsx
{!["step", "callout", "checklist"].includes(selectedField?.field_type ?? "") && (
  // ... existing label, description, placeholder, required, options editors
)}
```

- [ ] **Step 6: Load store type from URL or form data**

In the `useEffect` that loads the form (when editing), ensure `type` is loaded. Find the `loadForm()` call and verify the form object passed includes `type`. The Supabase query that fetches the form should already include all columns.

For new forms, check if the URL contains a `type` query param. At the top of the component:

```typescript
const typeParam = searchParams.get("type") as "form" | "workbook" | null;
// In the useEffect for new forms:
if (typeParam) {
  store.setType(typeParam);
}
```

- [ ] **Step 7: Pass type when creating form**

Find where `createForm` is called (the save/publish logic). Add `type: store.type` to the form data object.

- [ ] **Step 8: Verify typecheck**

Run: `npx tsc --noEmit 2>&1 | grep "builder/page" | head -5`
Expected: No new errors

- [ ] **Step 9: Commit**

```bash
git add src/app/_shared-pages/forms/builder/page.tsx
git commit -m "feat: integrate workbook field category and editors into form builder"
```

---

### Task 5: Workbook Public Renderer

**Files:**

- Create: `src/components/forms/workbook-renderer.tsx`

- [ ] **Step 1: Create the workbook renderer component**

This is the scrollable single-page renderer that replaces the multi-page form renderer when `type === 'workbook'`.

```tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CheckCircle2, Lightbulb, Zap, ChevronDown, Send } from "lucide-react";
import type { Form, FormField } from "@/types/database";

interface WorkbookRendererProps {
  form: Form & { form_fields: FormField[] };
  onSubmit: (answers: Record<string, unknown>) => void;
  isSubmitting: boolean;
}

// Types de champs non-remplissables (contenu statique)
const STATIC_TYPES = new Set([
  "step",
  "callout",
  "heading",
  "paragraph",
  "divider",
]);

// Variantes de callout
const CALLOUT_STYLES: Record<string, string> = {
  warning: "border-l-red-500 bg-red-50 dark:bg-red-950/20",
  info: "border-l-blue-500 bg-blue-50 dark:bg-blue-950/20",
  tip: "border-l-zinc-400 bg-zinc-50 dark:bg-zinc-800/30",
};

const CALLOUT_TITLE_STYLES: Record<string, string> = {
  warning: "text-red-600 dark:text-red-400",
  info: "text-blue-600 dark:text-blue-400",
  tip: "text-zinc-600 dark:text-zinc-400",
};

export function WorkbookRenderer({
  form,
  onSubmit,
  isSubmitting,
}: WorkbookRendererProps) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const fields = [...form.form_fields].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  const updateAnswer = (fieldId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = () => {
    onSubmit(answers);
  };

  // Grouper les champs par etapes
  const sections = groupFieldsBySteps(fields);

  // Compteur d'etapes
  let stepNumber = 0;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="max-w-[720px] mx-auto px-4 py-12">
        {/* Couverture */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-border text-muted-foreground mb-8">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#AF0000]" />
            Workbook Premium
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
            {form.title}
          </h1>
          {form.description && (
            <p className="text-base text-muted-foreground mt-4 max-w-lg mx-auto leading-relaxed">
              {form.description}
            </p>
          )}
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section, sIdx) => {
            if (section.type === "intro") {
              // Champs avant le premier step → bloc "Tes informations"
              return (
                <div
                  key={`intro-${sIdx}`}
                  className="bg-surface border border-border rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#AF0000]/10 flex items-center justify-center">
                      <Lightbulb className="w-5 h-5 text-[#AF0000]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">
                        Tes informations
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Pour personnaliser ton experience
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {section.fields.map((f) => (
                      <WorkbookField
                        key={f.id}
                        field={f}
                        value={answers[f.id]}
                        onChange={(v) => updateAnswer(f.id, v)}
                      />
                    ))}
                  </div>
                </div>
              );
            }

            // Step section
            stepNumber++;
            return (
              <div
                key={`step-${sIdx}`}
                className="bg-surface border border-border rounded-2xl p-6"
              >
                {/* Step header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#AF0000] text-white flex items-center justify-center text-lg font-bold shrink-0">
                    {stepNumber}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {section.step.label}
                    </h2>
                    {section.step.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {section.step.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Step content text */}
                {(section.step.options as unknown as { content?: string })
                  ?.content && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {
                      (section.step.options as unknown as { content: string })
                        .content
                    }
                  </p>
                )}

                {/* Fields within step */}
                <div className="space-y-4">
                  {section.fields.map((f) => {
                    if (f.field_type === "callout") {
                      const variant =
                        (f.options as unknown as { variant?: string })
                          ?.variant ?? "warning";
                      return (
                        <div
                          key={f.id}
                          className={cn(
                            "border-l-4 rounded-xl p-4",
                            CALLOUT_STYLES[variant],
                          )}
                        >
                          {f.label && (
                            <p
                              className={cn(
                                "text-sm font-semibold mb-1",
                                CALLOUT_TITLE_STYLES[variant],
                              )}
                            >
                              {f.label}
                            </p>
                          )}
                          <p className="text-sm text-foreground leading-relaxed">
                            {f.description}
                          </p>
                        </div>
                      );
                    }

                    if (f.field_type === "checklist") {
                      return (
                        <WorkbookChecklist
                          key={f.id}
                          field={f}
                          value={(answers[f.id] as string[]) ?? []}
                          onChange={(v) => updateAnswer(f.id, v)}
                        />
                      );
                    }

                    // Regular input fields — render as accordion
                    if (!STATIC_TYPES.has(f.field_type)) {
                      return (
                        <WorkbookAccordionField
                          key={f.id}
                          field={f}
                          value={answers[f.id]}
                          onChange={(v) => updateAnswer(f.id, v)}
                        />
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit */}
        <div className="mt-12 pb-8">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#AF0000] to-[#DC2626] text-white text-base font-semibold hover:from-[#8B0000] hover:to-[#B91C1C] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
          >
            <Send className="w-5 h-5" />
            {isSubmitting ? "Envoi en cours..." : "Envoyer le workbook"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────

type Section =
  | { type: "intro"; fields: FormField[] }
  | { type: "step"; step: FormField; fields: FormField[] };

function groupFieldsBySteps(fields: FormField[]): Section[] {
  const sections: Section[] = [];
  let currentSection: Section | null = null;

  for (const field of fields) {
    if (field.field_type === "step") {
      currentSection = { type: "step", step: field, fields: [] };
      sections.push(currentSection);
    } else if (currentSection) {
      currentSection.fields.push(field);
    } else {
      // Fields before first step → intro section
      if (sections.length === 0 || sections[0].type !== "intro") {
        sections.unshift({ type: "intro", fields: [] });
      }
      (sections[0] as { type: "intro"; fields: FormField[] }).fields.push(
        field,
      );
    }
  }

  return sections;
}

// ─── Field Components ─────────────────────────

function WorkbookAccordionField({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/30 transition-colors"
      >
        <Zap className="w-4 h-4 text-[#AF0000] shrink-0" />
        <span className="text-sm font-medium text-foreground flex-1">
          {field.label}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="px-4 pb-4">
          {field.description && (
            <p className="text-xs text-muted-foreground mb-2">
              {field.description}
            </p>
          )}
          <WorkbookField field={field} value={value} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

function WorkbookChecklist({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (itemValue: string) => {
    if (value.includes(itemValue)) {
      onChange(value.filter((v) => v !== itemValue));
    } else {
      onChange([...value, itemValue]);
    }
  };

  return (
    <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-800/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-4 h-4 text-[#AF0000]" />
        <span className="text-sm font-semibold text-foreground">
          {field.label}
        </span>
      </div>
      <div className="space-y-2">
        {(field.options ?? []).map((opt) => (
          <label
            key={opt.value}
            className="flex items-start gap-2.5 cursor-pointer group"
          >
            <input
              type="checkbox"
              checked={value.includes(opt.value)}
              onChange={() => toggle(opt.value)}
              className="mt-0.5 w-4 h-4 rounded border-border text-[#AF0000] focus:ring-[#AF0000]/20"
            />
            <span className="text-sm text-foreground group-hover:text-foreground/80">
              {opt.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function WorkbookField({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  switch (field.field_type) {
    case "short_text":
    case "email":
    case "phone":
      return (
        <input
          type={
            field.field_type === "email"
              ? "email"
              : field.field_type === "phone"
                ? "tel"
                : "text"
          }
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ""}
          className="w-full h-10 px-3 bg-white dark:bg-zinc-900 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#AF0000]/20 focus:border-[#AF0000]/30"
        />
      );
    case "long_text":
      return (
        <textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ""}
          rows={4}
          className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#AF0000]/20 focus:border-[#AF0000]/30 resize-none"
        />
      );
    case "number":
      return (
        <input
          type="number"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ""}
          className="w-full h-10 px-3 bg-white dark:bg-zinc-900 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#AF0000]/20 focus:border-[#AF0000]/30"
        />
      );
    case "single_select":
    case "dropdown":
      return (
        <select
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 px-3 bg-white dark:bg-zinc-900 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#AF0000]/20"
        >
          <option value="">Selectionner...</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    case "rating":
      return (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={cn(
                "w-10 h-10 rounded-xl border text-sm font-medium transition-all",
                (value as number) >= n
                  ? "bg-[#AF0000] text-white border-[#AF0000]"
                  : "bg-white dark:bg-zinc-900 border-border text-muted-foreground hover:border-[#AF0000]/30",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      );
    default:
      return (
        <input
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ""}
          className="w-full h-10 px-3 bg-white dark:bg-zinc-900 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#AF0000]/20 focus:border-[#AF0000]/30"
        />
      );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/forms/workbook-renderer.tsx
git commit -m "feat: add workbook public renderer with scrollable page layout"
```

---

### Task 6: Integrate Workbook Renderer into Public Form Page

**Files:**

- Modify: `src/app/f/[formId]/page.tsx`

- [ ] **Step 1: Import WorkbookRenderer**

Add at the top of the file:

```typescript
import { WorkbookRenderer } from "@/components/forms/workbook-renderer";
```

- [ ] **Step 2: Add workbook detection and rendering**

Find the main render return in `PublicFormContent`. Before the existing form rendering JSX (the progressive multi-page renderer), add a conditional:

```tsx
// Workbook mode — single scrollable page
if (form.type === "workbook") {
  return (
    <WorkbookRenderer
      form={form}
      onSubmit={(answers) => submitForm.mutate({ formId: form.id, answers })}
      isSubmitting={submitForm.isPending}
    />
  );
}

// Original form rendering below...
```

Make sure the `submitForm` mutation is compatible — it should already accept `{ formId, answers }` and POST to `/api/forms/submit`.

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit 2>&1 | grep "f/\[formId\]" | head -5`
Expected: No new errors

- [ ] **Step 4: Commit**

```bash
git add src/app/f/[formId]/page.tsx
git commit -m "feat: route workbook forms to dedicated scrollable renderer"
```

---

### Task 7: Template Gallery — Workbook Tab

**Files:**

- Modify: `src/components/forms/template-gallery.tsx`
- Modify: `src/lib/form-templates.ts`

- [ ] **Step 1: Add workbook type to FormTemplate interface in `src/lib/form-templates.ts`**

```typescript
export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category:
    | "satisfaction"
    | "onboarding"
    | "evaluation"
    | "feedback"
    | "sondage";
  type: "form" | "workbook"; // NEW
  icon: string;
  fields: FormTemplateField[];
}
```

Add `type: "form"` to all existing templates in the `FORM_TEMPLATES` array.

- [ ] **Step 2: Add the Workbook Marche template**

Add this template to the `FORM_TEMPLATES` array:

```typescript
{
  id: "workbook-marche",
  name: "Workbook Marche UPSCALE",
  description: "5 etapes pour creer ton marche UPSCALE",
  category: "onboarding",
  type: "workbook",
  icon: "BookOpen",
  fields: [
    { label: "Prenom", field_type: "short_text", required: true, sort_order: 0, options: null, placeholder: "Ton prenom", validation: null, conditional_logic: null },
    { label: "Nom", field_type: "short_text", required: true, sort_order: 1, options: null, placeholder: "Ton nom", validation: null, conditional_logic: null },
    { label: "Identifier une frustration majeure", field_type: "step", required: false, sort_order: 2, options: null, placeholder: null, validation: null, conditional_logic: null },
    { label: "Quelle frustration principale ai-je identifiee dans mon marche ?", field_type: "long_text", required: false, sort_order: 3, options: null, placeholder: "Decris la frustration...", validation: null, conditional_logic: null },
    { label: "Pourquoi cette frustration est-elle une vraie douleur pour ma cible ?", field_type: "long_text", required: false, sort_order: 4, options: null, placeholder: "Explique l'impact...", validation: null, conditional_logic: null },
    { label: "Ai-je des preuves concretes que cette frustration est reelle ?", field_type: "long_text", required: false, sort_order: 5, options: null, placeholder: "Preuves et exemples...", validation: null, conditional_logic: null },
    { label: "Choisir un segment specifique", field_type: "step", required: false, sort_order: 6, options: null, placeholder: null, validation: null, conditional_logic: null },
    { label: "Qui ressent cette frustration le plus intensement ?", field_type: "long_text", required: false, sort_order: 7, options: null, placeholder: "Decris ton segment cible...", validation: null, conditional_logic: null },
    { label: "Quelle est leur situation actuelle ?", field_type: "long_text", required: false, sort_order: 8, options: null, placeholder: "Situation de ta cible...", validation: null, conditional_logic: null },
    { label: "Definir un mecanisme unique", field_type: "step", required: false, sort_order: 9, options: null, placeholder: null, validation: null, conditional_logic: null },
    { label: "Qu'est-ce que les solutions actuelles ratent ou font mal ?", field_type: "long_text", required: false, sort_order: 10, options: null, placeholder: "Analyse des solutions existantes...", validation: null, conditional_logic: null },
    { label: "Quelle approche differente pourrais-je explorer ?", field_type: "long_text", required: false, sort_order: 11, options: null, placeholder: "Ton approche unique...", validation: null, conditional_logic: null },
    { label: "Quel nom donnerais-tu a cette idee ou mecanisme ?", field_type: "short_text", required: false, sort_order: 12, options: null, placeholder: "Nom du mecanisme...", validation: null, conditional_logic: null },
    { label: "Creer une nouvelle categorie", field_type: "step", required: false, sort_order: 13, options: null, placeholder: null, validation: null, conditional_logic: null },
    { label: "Quel est le nom de ta categorie ?", field_type: "short_text", required: false, sort_order: 14, options: null, placeholder: "Nom de la categorie...", validation: null, conditional_logic: null },
    { label: "En quoi ta categorie est differente des offres classiques ?", field_type: "long_text", required: false, sort_order: 15, options: null, placeholder: "Differenciation...", validation: null, conditional_logic: null },
    { label: "Eduquer ton marche", field_type: "step", required: false, sort_order: 16, options: null, placeholder: null, validation: null, conditional_logic: null },
    { label: "Quel est le message cle que ton marche doit comprendre ?", field_type: "long_text", required: false, sort_order: 17, options: null, placeholder: "Ton message central...", validation: null, conditional_logic: null },
    { label: "Quels formats utiliserais-tu pour eduquer ?", field_type: "long_text", required: false, sort_order: 18, options: null, placeholder: "Posts, videos, podcasts...", validation: null, conditional_logic: null },
  ],
},
```

- [ ] **Step 3: Add tab switch to `src/components/forms/template-gallery.tsx`**

Add a state for the type filter at the top of the component:

```typescript
const [typeFilter, setTypeFilter] = useState<"form" | "workbook">("form");
```

Add tab buttons before the category filters:

```tsx
<div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1 mb-4">
  <button
    onClick={() => setTypeFilter("form")}
    className={cn(
      "h-8 px-4 rounded-lg text-xs font-medium transition-all",
      typeFilter === "form"
        ? "bg-surface text-foreground shadow-sm"
        : "text-muted-foreground hover:text-foreground",
    )}
  >
    Formulaires
  </button>
  <button
    onClick={() => setTypeFilter("workbook")}
    className={cn(
      "h-8 px-4 rounded-lg text-xs font-medium transition-all",
      typeFilter === "workbook"
        ? "bg-surface text-foreground shadow-sm"
        : "text-muted-foreground hover:text-foreground",
    )}
  >
    Workbooks
  </button>
</div>
```

Filter templates by type in the `useMemo`:

```typescript
const filtered = useMemo(() => {
  let result = templates.filter((t) => (t.type ?? "form") === typeFilter);
  // ... existing search and category filters
}, [templates, typeFilter, search, category]);
```

Update the "Create from scratch" handler to pass the type:

```typescript
onCreateBlank={() => onCreateBlank(typeFilter)}
```

Update the `TemplateGalleryProps` interface:

```typescript
onCreateBlank: (type?: "form" | "workbook") => void;
```

- [ ] **Step 4: Update callers of template gallery to pass type through**

In the forms/new page, update the `onCreateBlank` handler to navigate with type query param:

```typescript
router.push(`${prefix}/forms/builder?type=${type ?? "form"}`);
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/form-templates.ts src/components/forms/template-gallery.tsx
git commit -m "feat: add workbook tab to template gallery with Marche template"
```

---

### Task 8: Forms List — Type Badge & Filter

**Files:**

- Modify: `src/app/_shared-pages/forms/page.tsx`

- [ ] **Step 1: Add type badge to form cards**

Find the form card rendering (the `forms.map()` block). Inside each card, after the status badge, add:

```tsx
{
  form.type === "workbook" && (
    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
      Workbook
    </span>
  );
}
```

- [ ] **Step 2: Add type filter**

Add a type filter state:

```typescript
const [typeFilter, setTypeFilter] = useState<"all" | "form" | "workbook">(
  "all",
);
```

Add filter buttons after the status filters:

```tsx
<div className="flex items-center gap-1 ml-4 pl-4 border-l border-border">
  {[
    { value: "all", label: "Tous types" },
    { value: "form", label: "Formulaires" },
    { value: "workbook", label: "Workbooks" },
  ].map((f) => (
    <button
      key={f.value}
      onClick={() => setTypeFilter(f.value as typeof typeFilter)}
      className={cn(
        "h-7 px-2.5 text-[11px] font-medium rounded-lg transition-all",
        typeFilter === f.value
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {f.label}
    </button>
  ))}
</div>
```

Filter the forms list:

```typescript
const filteredForms = useMemo(() => {
  if (!forms) return [];
  if (typeFilter === "all") return forms;
  return forms.filter((f) => (f.type ?? "form") === typeFilter);
}, [forms, typeFilter]);
```

Use `filteredForms` instead of `forms` in the rendering.

- [ ] **Step 3: Update page title count**

```tsx
<p className="text-sm text-muted-foreground/80 mt-1.5 leading-relaxed">
  {filteredForms.length} formulaire{filteredForms.length !== 1 ? "s" : ""}
  {typeFilter !== "all" &&
    ` (${typeFilter === "workbook" ? "workbooks" : "formulaires"})`}
</p>
```

- [ ] **Step 4: Commit**

```bash
git add src/app/_shared-pages/forms/page.tsx
git commit -m "feat: add type badge and workbook filter to forms list"
```

---

### Task 9: Workbook Submission View (Admin)

**Files:**

- Create: `src/components/forms/workbook-submission-view.tsx`

- [ ] **Step 1: Create the submission view component**

This groups answers by step for workbook submissions.

```tsx
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
        // Skip static non-data fields
        if (
          field.field_type === "callout" ||
          field.field_type === "heading" ||
          field.field_type === "paragraph" ||
          field.field_type === "divider"
        ) {
          return null;
        }

        // Step separator
        if (field.field_type === "step") {
          stepNumber++;
          return (
            <div
              key={field.id}
              className="flex items-center gap-3 pt-4 first:pt-0"
            >
              <div className="w-8 h-8 rounded-full bg-[#AF0000] text-white flex items-center justify-center text-sm font-bold shrink-0">
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

        // Checklist
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

        // Regular answer
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
```

- [ ] **Step 2: Integrate into the form detail/submissions page**

In `src/app/_shared-pages/forms/[formId]/page.tsx`, import and use `WorkbookSubmissionView` when viewing a workbook submission. Find where individual submissions are rendered and add:

```tsx
import { WorkbookSubmissionView } from "@/components/forms/workbook-submission-view";

// In submission detail rendering:
{form.type === "workbook" ? (
  <WorkbookSubmissionView fields={form.form_fields ?? []} submission={submission} />
) : (
  // ... existing form submission rendering
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/forms/workbook-submission-view.tsx src/app/_shared-pages/forms/\[formId\]/page.tsx
git commit -m "feat: add workbook submission view grouped by steps"
```

---

### Task 10: Final Verification & Build

**Files:** None (verification only)

- [ ] **Step 1: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep "error TS" | head -20`
Expected: No new errors related to workbook changes

- [ ] **Step 2: Build**

Kill any running dev server first, then:
Run: `npx next build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 3: Manual smoke test**

1. Go to `/admin/forms/new` → verify Formulaires/Workbooks tabs appear
2. Click "Workbooks" → verify "Creer de zero" works and opens builder with workbook type
3. In builder → verify "Structure Workbook" category appears with Step, Callout, Checklist
4. Add a step + fields + checklist → verify preview shows scrollable workbook layout
5. Save and publish → verify it appears in forms list with "Workbook" badge
6. Open public URL `/f/[id]` → verify scrollable workbook renders correctly
7. Fill and submit → verify submission appears grouped by steps in admin

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: workbook system — type flag, new field types, builder integration, scrollable renderer, submission view"
```
