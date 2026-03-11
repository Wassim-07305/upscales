-- Avis et notes sur les formations
create table if not exists formation_reviews (
  id uuid primary key default gen_random_uuid(),
  formation_id uuid not null references formations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(formation_id, user_id)
);

-- Index
create index if not exists idx_formation_reviews_formation on formation_reviews(formation_id);
create index if not exists idx_formation_reviews_user on formation_reviews(user_id);

-- RLS
alter table formation_reviews enable row level security;

-- Tout le monde peut voir les avis
create policy "Les avis sont visibles par tous"
  on formation_reviews for select using (true);

-- Les utilisateurs inscrits peuvent créer un avis
create policy "Les utilisateurs peuvent créer un avis"
  on formation_reviews for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from formation_enrollments
      where formation_enrollments.user_id = auth.uid()
        and formation_enrollments.formation_id = formation_reviews.formation_id
    )
  );

-- Les utilisateurs peuvent modifier leur propre avis
create policy "Les utilisateurs peuvent modifier leur avis"
  on formation_reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leur propre avis
create policy "Les utilisateurs peuvent supprimer leur avis"
  on formation_reviews for delete
  using (auth.uid() = user_id);
