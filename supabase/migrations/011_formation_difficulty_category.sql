-- Ajout difficulté et catégorie aux formations
alter table formations
  add column if not exists difficulty text default 'beginner'
    check (difficulty in ('beginner', 'intermediate', 'advanced')),
  add column if not exists category text;

-- Index pour le filtrage
create index if not exists idx_formations_difficulty on formations(difficulty);
create index if not exists idx_formations_category on formations(category);
