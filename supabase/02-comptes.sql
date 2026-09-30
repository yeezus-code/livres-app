-- =============================================================================
-- Étape 2 : les comptes (pseudos)
-- À copier-coller en entier dans Supabase > SQL Editor, puis cliquer « Run ».
-- (Le fichier 01-bibliotheque.sql doit avoir été lancé avant.)
-- =============================================================================

-- Une ligne = le profil d'une personne qui a créé un compte
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  -- 3 à 20 caractères : lettres minuscules sans accent, chiffres ou « _ »
  username    text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Les pseudos sont publics (ils serviront aux profils publics)
drop policy if exists "Pseudos visibles par tous" on public.profiles;
create policy "Pseudos visibles par tous" on public.profiles
  for select to anon, authenticated
  using (true);

-- Seule une personne avec un vrai compte (pas une session anonyme) crée son profil
drop policy if exists "Créer son profil" on public.profiles;
create policy "Créer son profil" on public.profiles
  for insert to authenticated
  with check (
    (select auth.uid()) = id
    and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
  );

drop policy if exists "Modifier son profil" on public.profiles;
create policy "Modifier son profil" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
