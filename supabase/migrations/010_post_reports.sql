-- Table de signalement de posts
create table if not exists post_reports (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade not null,
  reporter_id uuid references profiles(id) on delete cascade not null,
  reason text not null default 'inappropriate',
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now() not null,
  unique(post_id, reporter_id)
);

-- RLS
alter table post_reports enable row level security;

-- Les utilisateurs peuvent créer des signalements
create policy "Users can report posts"
  on post_reports for insert
  with check (auth.uid() = reporter_id);

-- Les utilisateurs peuvent voir leurs propres signalements
create policy "Users can view own reports"
  on post_reports for select
  using (auth.uid() = reporter_id);

-- Les admins/moderateurs peuvent tout voir et modifier
create policy "Moderators can manage reports"
  on post_reports for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('admin', 'moderator')
    )
  );

-- Index
create index if not exists idx_post_reports_status on post_reports(status);
create index if not exists idx_post_reports_post_id on post_reports(post_id);
