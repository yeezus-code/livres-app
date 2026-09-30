-- =============================================================================
-- Étape 1 : la bibliothèque
-- À copier-coller en entier dans Supabase > SQL Editor, puis cliquer « Run ».
-- =============================================================================

-- Une ligne = un livre dans la bibliothèque d'un utilisateur
create table if not exists public.library_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  book_id     text not null,                 -- ex. "ol:OL45883W" ou "gb:abc123"
  title       text not null,
  authors     text[] not null default '{}',
  cover_url   text,
  genres      text[] not null default '{}',
  year        integer,
  rating      smallint check (rating between 1 and 5),
  review      text check (char_length(review) <= 5000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, book_id)                  -- un même livre une seule fois par personne
);

create index if not exists library_entries_user_idx
  on public.library_entries (user_id, created_at desc);

-- Met à jour automatiquement « updated_at » à chaque modification
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists library_entries_updated_at on public.library_entries;
create trigger library_entries_updated_at
  before update on public.library_entries
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Sécurité : chacun ne voit et ne modifie QUE ses propres livres.
-- (Les profils publics viendront plus tard et élargiront la lecture.)
-- -----------------------------------------------------------------------------
alter table public.library_entries enable row level security;

drop policy if exists "Lire ses livres" on public.library_entries;
create policy "Lire ses livres" on public.library_entries
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Ajouter ses livres" on public.library_entries;
create policy "Ajouter ses livres" on public.library_entries
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Modifier ses livres" on public.library_entries;
create policy "Modifier ses livres" on public.library_entries
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Retirer ses livres" on public.library_entries;
create policy "Retirer ses livres" on public.library_entries
  for delete to authenticated
  using ((select auth.uid()) = user_id);
