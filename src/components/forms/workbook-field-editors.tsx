"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  useFormBuilderStore,
  type BuilderField,
} from "@/stores/form-builder-store";

// Styles reutilisables
const labelClass = "text-xs font-medium text-muted-foreground mb-1";
const inputClass =
  "w-full h-9 px-3 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20";
const textareaClass =
  "w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none";
const addButtonClass =
  "w-full flex items-center justify-center gap-1.5 h-9 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:bg-muted/50 transition-colors";

// --- StepFieldEditor ---

interface StepFieldEditorProps {
  field: BuilderField;
}

export function StepFieldEditor({ field }: StepFieldEditorProps) {
  const updateField = useFormBuilderStore((s) => s.updateField);

  const content =
    (field.options as unknown as { content?: string })?.content ?? "";

  return (
    <div className="space-y-3">
      <div>
        <label className={labelClass}>Titre</label>
        <input
          type="text"
          className={inputClass}
          value={field.label}
          onChange={(e) => updateField(field.id, { label: e.target.value })}
          placeholder="Titre de l'étape"
        />
      </div>

      <div>
        <label className={labelClass}>Sous-titre</label>
        <input
          type="text"
          className={inputClass}
          value={field.description}
          onChange={(e) =>
            updateField(field.id, { description: e.target.value })
          }
          placeholder="Sous-titre optionnel"
        />
      </div>

      <div>
        <label className={labelClass}>Contenu</label>
        <textarea
          className={textareaClass}
          rows={5}
          value={content}
          onChange={(e) =>
            updateField(field.id, {
              options: {
                content: e.target.value,
              } as unknown as BuilderField["options"],
            })
          }
          placeholder="Contenu de l'étape..."
        />
      </div>
    </div>
  );
}

// --- CalloutFieldEditor ---

const CALLOUT_VARIANTS = [
  { value: "warning", label: "Alerte (rouge)" },
  { value: "info", label: "Info (bleu)" },
  { value: "tip", label: "Conseil (gris)" },
] as const;

interface CalloutFieldEditorProps {
  field: BuilderField;
}

export function CalloutFieldEditor({ field }: CalloutFieldEditorProps) {
  const updateField = useFormBuilderStore((s) => s.updateField);

  const variant =
    (field.options as unknown as { variant?: string })?.variant ?? "info";

  return (
    <div className="space-y-3">
      <div>
        <label className={labelClass}>Titre</label>
        <input
          type="text"
          className={inputClass}
          value={field.label}
          onChange={(e) => updateField(field.id, { label: e.target.value })}
          placeholder="Titre du callout"
        />
      </div>

      <div>
        <label className={labelClass}>Contenu</label>
        <textarea
          className={textareaClass}
          rows={3}
          value={field.description}
          onChange={(e) =>
            updateField(field.id, { description: e.target.value })
          }
          placeholder="Contenu du callout..."
        />
      </div>

      <div>
        <label className={labelClass}>Variante</label>
        <select
          className={inputClass}
          value={variant}
          onChange={(e) =>
            updateField(field.id, {
              options: {
                variant: e.target.value,
              } as unknown as BuilderField["options"],
            })
          }
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

// --- ChecklistFieldEditor ---

interface ChecklistFieldEditorProps {
  field: BuilderField;
}

export function ChecklistFieldEditor({ field }: ChecklistFieldEditorProps) {
  const updateField = useFormBuilderStore((s) => s.updateField);

  const items = Array.isArray(field.options) ? field.options : [];

  const handleAddItem = () => {
    const newItem = { label: "", value: `item_${items.length + 1}` };
    updateField(field.id, { options: [...items, newItem] });
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    updateField(field.id, { options: updated });
  };

  const handleUpdateItemLabel = (index: number, label: string) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, label } : item,
    );
    updateField(field.id, { options: updated });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className={labelClass}>Titre</label>
        <input
          type="text"
          className={inputClass}
          value={field.label}
          onChange={(e) => updateField(field.id, { label: e.target.value })}
          placeholder="Titre de la checklist"
        />
      </div>

      <div>
        <label className={labelClass}>Éléments</label>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={item.value} className="flex items-center gap-2">
              <input
                type="text"
                className={inputClass}
                value={item.label}
                onChange={(e) => handleUpdateItemLabel(index, e.target.value)}
                placeholder={`Élément ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => handleRemoveItem(index)}
                className="flex-shrink-0 p-2 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddItem}
            className={addButtonClass}
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter un élément
          </button>
        </div>
      </div>
    </div>
  );
}
