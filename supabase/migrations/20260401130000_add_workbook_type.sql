-- Ajouter le type de formulaire (form ou workbook)
ALTER TABLE forms ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'form';

-- Contrainte pour les valeurs autorisees
ALTER TABLE forms ADD CONSTRAINT forms_type_check CHECK (type IN ('form', 'workbook'));

-- Elargir la contrainte field_type pour accepter les nouveaux types workbook
ALTER TABLE form_fields DROP CONSTRAINT IF EXISTS form_fields_field_type_check;
ALTER TABLE form_fields ADD CONSTRAINT form_fields_field_type_check CHECK (field_type = ANY (ARRAY['short_text', 'long_text', 'email', 'phone', 'number', 'single_select', 'multi_select', 'dropdown', 'rating', 'nps', 'scale', 'date', 'time', 'file_upload', 'heading', 'paragraph', 'divider', 'step', 'callout', 'checklist']));
