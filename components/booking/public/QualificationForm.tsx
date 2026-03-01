"use client";

import { type FormEvent } from "react";
import { User, Mail, Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QualificationField } from "@/lib/types/database";

interface FormData {
  prospectName: string;
  prospectEmail: string;
  prospectPhone: string;
  qualificationAnswers: Record<string, string>;
}

interface QualificationFormProps {
  qualificationFields: QualificationField[];
  formData: FormData;
  onChange: (data: FormData) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function QualificationForm({
  qualificationFields,
  formData,
  onChange,
  onSubmit,
  loading,
}: QualificationFormProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const updateField = (key: keyof FormData, value: string) => {
    onChange({ ...formData, [key]: value });
  };

  const updateQualification = (fieldId: string, value: string) => {
    onChange({
      ...formData,
      qualificationAnswers: {
        ...formData.qualificationAnswers,
        [fieldId]: value,
      },
    });
  };

  return (
    <Card className="gradient-border bg-[#141414]">
      <CardHeader>
        <CardTitle className="text-lg">Vos informations</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="prospect-name">
              <User className="size-3.5 text-muted-foreground" />
              Nom complet <span className="text-destructive">*</span>
            </Label>
            <Input
              id="prospect-name"
              required
              placeholder="Jean Dupont"
              value={formData.prospectName}
              onChange={(e) => updateField("prospectName", e.target.value)}
              className="bg-muted/50"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="prospect-email">
              <Mail className="size-3.5 text-muted-foreground" />
              Adresse email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="prospect-email"
              type="email"
              required
              placeholder="jean@exemple.fr"
              value={formData.prospectEmail}
              onChange={(e) => updateField("prospectEmail", e.target.value)}
              className="bg-muted/50"
            />
          </div>

          {/* Telephone */}
          <div className="space-y-2">
            <Label htmlFor="prospect-phone">
              <Phone className="size-3.5 text-muted-foreground" />
              Téléphone
            </Label>
            <Input
              id="prospect-phone"
              type="tel"
              placeholder="06 12 34 56 78"
              value={formData.prospectPhone}
              onChange={(e) => updateField("prospectPhone", e.target.value)}
              className="bg-muted/50"
            />
          </div>

          {/* Champs dynamiques de qualification */}
          {qualificationFields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={`qual-${field.id}`}>
                {field.label}
                {field.required && (
                  <span className="text-destructive"> *</span>
                )}
              </Label>
              {renderQualificationField(field, formData, updateQualification)}
            </div>
          ))}

          {/* Bouton soumettre */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 text-base font-semibold gap-2"
          >
            Continuer
            <ArrowRight className="size-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function renderQualificationField(
  field: QualificationField,
  formData: FormData,
  updateQualification: (fieldId: string, value: string) => void
) {
  const value = formData.qualificationAnswers[field.id] ?? "";

  switch (field.type) {
    case "text":
      return (
        <Input
          id={`qual-${field.id}`}
          required={field.required}
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => updateQualification(field.id, e.target.value)}
          className="bg-muted/50"
        />
      );

    case "email":
      return (
        <Input
          id={`qual-${field.id}`}
          type="email"
          required={field.required}
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => updateQualification(field.id, e.target.value)}
          className="bg-muted/50"
        />
      );

    case "phone":
      return (
        <Input
          id={`qual-${field.id}`}
          type="tel"
          required={field.required}
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => updateQualification(field.id, e.target.value)}
          className="bg-muted/50"
        />
      );

    case "textarea":
      return (
        <Textarea
          id={`qual-${field.id}`}
          required={field.required}
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => updateQualification(field.id, e.target.value)}
          className="bg-muted/50"
        />
      );

    case "select":
      return (
        <Select
          value={value}
          onValueChange={(v) => updateQualification(field.id, v)}
          required={field.required}
        >
          <SelectTrigger id={`qual-${field.id}`} className="w-full bg-muted/50">
            <SelectValue placeholder={field.placeholder || "Sélectionnez..."} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    default:
      return null;
  }
}
