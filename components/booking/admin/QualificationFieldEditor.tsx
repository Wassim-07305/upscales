"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, X } from "lucide-react";
import { QualificationField } from "@/lib/types/database";

interface QualificationFieldEditorProps {
  fields: QualificationField[];
  onChange: (fields: QualificationField[]) => void;
}

export function QualificationFieldEditor({
  fields,
  onChange,
}: QualificationFieldEditorProps) {
  function addField() {
    const newField: QualificationField = {
      id: crypto.randomUUID(),
      type: "text",
      label: "",
      placeholder: "",
      required: false,
      options: [],
    };
    onChange([...fields, newField]);
  }

  function updateField(id: string, updates: Partial<QualificationField>) {
    onChange(
      fields.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  }

  function removeField(id: string) {
    onChange(fields.filter((f) => f.id !== id));
  }

  function addOption(fieldId: string) {
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;
    updateField(fieldId, {
      options: [...(field.options || []), ""],
    });
  }

  function updateOption(fieldId: string, index: number, value: string) {
    const field = fields.find((f) => f.id === fieldId);
    if (!field?.options) return;
    const newOptions = [...field.options];
    newOptions[index] = value;
    updateField(fieldId, { options: newOptions });
  }

  function removeOption(fieldId: string, index: number) {
    const field = fields.find((f) => f.id === fieldId);
    if (!field?.options) return;
    const newOptions = field.options.filter((_, i) => i !== index);
    updateField(fieldId, { options: newOptions });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Questions de qualification</h3>
          <p className="text-xs text-muted-foreground">
            Questions posées au prospect lors de la réservation
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={addField}>
          <Plus className="h-4 w-4 mr-1" />
          Ajouter une question
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Aucune question configurée. Les prospects pourront réserver sans
          remplir de formulaire supplémentaire.
        </p>
      )}

      <div className="space-y-3">
        {fields.map((field, index) => (
          <Card key={field.id} className="bg-[#141414] border-[#2A2A2A]">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-start gap-2">
                <GripVertical className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
                <div className="flex-1 space-y-3">
                  {/* Ligne 1 : Label + Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Question {index + 1}
                      </Label>
                      <Input
                        value={field.label}
                        onChange={(e) =>
                          updateField(field.id, { label: e.target.value })
                        }
                        placeholder="Ex : Votre entreprise"
                        className="bg-[#0D0D0D] border-[#2A2A2A]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value) =>
                          updateField(field.id, {
                            type: value as QualificationField["type"],
                          })
                        }
                      >
                        <SelectTrigger className="bg-[#0D0D0D] border-[#2A2A2A]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Texte court</SelectItem>
                          <SelectItem value="textarea">Texte long</SelectItem>
                          <SelectItem value="select">Liste déroulante</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Téléphone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Ligne 2 : Placeholder */}
                  <div className="space-y-1">
                    <Label className="text-xs">Placeholder</Label>
                    <Input
                      value={field.placeholder || ""}
                      onChange={(e) =>
                        updateField(field.id, { placeholder: e.target.value })
                      }
                      placeholder="Texte indicatif..."
                      className="bg-[#0D0D0D] border-[#2A2A2A]"
                    />
                  </div>

                  {/* Options pour le type "select" */}
                  {field.type === "select" && (
                    <div className="space-y-2">
                      <Label className="text-xs">Options</Label>
                      {(field.options || []).map((option, optIndex) => (
                        <div key={optIndex} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) =>
                              updateOption(field.id, optIndex, e.target.value)
                            }
                            placeholder={`Option ${optIndex + 1}`}
                            className="bg-[#0D0D0D] border-[#2A2A2A]"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(field.id, optIndex)}
                            className="shrink-0 h-9 w-9 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addOption(field.id)}
                        className="text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Ajouter une option
                      </Button>
                    </div>
                  )}

                  {/* Obligatoire */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={field.required}
                      onCheckedChange={(checked) =>
                        updateField(field.id, { required: checked })
                      }
                      size="sm"
                    />
                    <Label className="text-xs text-muted-foreground">
                      Obligatoire
                    </Label>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeField(field.id)}
                  className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
