-- =============================================================================
-- Étape 4 : profils publics et abonnements
-- À copier-coller en entier dans Supabase > SQL Editor, puis cliquer « Run ».
-- (Les fichiers 01, 02 et 03 doivent avoir été lancés avant.)
-- =============================================================================

-- Les bibliothèques des personnes qui ont un compte (donc un pseudo) sont
-- publiques : tout le monde peut les lire, personne d'autre ne peut les modifier.
-- Les bibliothèques « sans compte » restent privées.
drop policy if exists "Bibliothèques publiques" on public.library_entries;
create policy "Bibliothèques publiques" on public.library_entries
  for select to anon, authenticated
  using (exists (select 1 from public.profiles p where p.id = library_entries.user_id));

-- Une ligne = « follower » suit « followee »
create table if not exists public.follows (
  follower_id  uuid not null references public.profiles (id) on delete cascade,
  followee_id  uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)          -- on ne se suit pas soi-même
);

create index if not exists follows_followee_idx on public.follows (followee_id);

alter table public.follows enable row level security;

-- Qui suit qui est public (comme sur Letterboxd)
drop policy if exists "Abonnements visibles par tous" on public.follows;
create policy "Abonnements visibles par tous" on public.follows
  for select to anon, authenticated
  using (true);

-- On ne peut s'abonner / se désabonner qu'en son propre nom
drop policy if exists "S'abonner" on public.follows;
create policy "S'abonner" on public.follows
  for insert to authenticated
  with check ((select auth.uid()) = follower_id);

drop policy if exists "Se désabonner" on public.follows;
create policy "Se désabonner" on public.follows
  for delete to authenticated
  using ((select auth.uid()) = follower_id);
