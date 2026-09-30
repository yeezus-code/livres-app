-- =============================================================================
-- Étape 5 : photos de profil et page d'accueil
-- À copier-coller en entier dans Supabase > SQL Editor, puis cliquer « Run ».
-- (Les fichiers 01 à 04 doivent avoir été lancés avant.)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Photos de profil
-- -----------------------------------------------------------------------------
alter table public.profiles add column if not exists avatar_url text;

-- Un « bucket » = un dossier de fichiers dans Supabase Storage.
-- Public : n'importe qui peut afficher les photos. Taille max : 1 Mo par photo
-- (l'application réduit les photos à 256 × 256 pixels avant l'envoi).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Chaque compte ne peut écrire que dans son propre dossier : avatars/<son identifiant>/…
drop policy if exists "Avatars : lecture" on storage.objects;
create policy "Avatars : lecture" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'avatars');

drop policy if exists "Avatars : ajout" on storage.objects;
create policy "Avatars : ajout" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
  );

drop policy if exists "Avatars : remplacement" on storage.objects;
create policy "Avatars : remplacement" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Avatars : suppression" on storage.objects;
create policy "Avatars : suppression" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- -----------------------------------------------------------------------------
-- Statistiques par livre, pour la page d'accueil (mieux notés, plus lus).
-- Ne compte que les bibliothèques publiques (celles des comptes avec pseudo).
-- « security_invoker » : la vue respecte les règles de sécurité des tables.
-- -----------------------------------------------------------------------------
create or replace view public.book_stats
with (security_invoker = true) as
with public_entries as (
  select e.*
  from public.library_entries e
  where exists (select 1 from public.profiles p where p.id = e.user_id)
),
counts as (
  select
    book_id,
    count(*)               as readers,   -- nombre de lecteurs
    count(rating)          as ratings,   -- nombre de notes
    round(avg(rating), 1)  as average,   -- note moyenne
    -- Score « prudent » : un livre noté 5 par une seule personne ne passe pas
    -- devant un livre noté 4,8 par vingt personnes (on ajoute 3 notes fictives de 3).
    case when count(rating) > 0
      then (sum(rating) + 9.0) / (count(rating) + 3)
    end                    as score
  from public_entries
  group by book_id
),
info as (
  -- Pour chaque livre, les infos d'une des fiches (de préférence avec couverture)
  select distinct on (book_id) book_id, title, authors, cover_url, genres, year
  from public_entries
  order by book_id, (cover_url is null), created_at
)
select info.*, counts.readers, counts.ratings, counts.average, counts.score
from info
join counts using (book_id);

grant select on public.book_stats to anon, authenticated;
