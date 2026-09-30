-- =============================================================================
-- Étape 6 : liste « À lire », date de lecture, « j'aime » sur les avis
-- À copier-coller en entier dans Supabase > SQL Editor, puis cliquer « Run ».
-- (Les fichiers 01 à 05 doivent avoir été lancés avant.)
-- =============================================================================

-- « lu » (dans la bibliothèque) ou « a_lire » (dans la liste « À lire »).
-- Les livres déjà enregistrés sont considérés comme lus.
alter table public.library_entries
  add column if not exists status text not null default 'lu'
  check (status in ('lu', 'a_lire'));

-- Date à laquelle le livre a été lu (facultative)
alter table public.library_entries
  add column if not exists read_on date;

-- -----------------------------------------------------------------------------
-- « J'aime » : une ligne = un lecteur aime l'avis d'un autre lecteur
-- -----------------------------------------------------------------------------
create table if not exists public.review_likes (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  entry_id    uuid not null references public.library_entries (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, entry_id)
);

create index if not exists review_likes_entry_idx on public.review_likes (entry_id);

alter table public.review_likes enable row level security;

drop policy if exists "J'aime visibles par tous" on public.review_likes;
create policy "J'aime visibles par tous" on public.review_likes
  for select to anon, authenticated
  using (true);

drop policy if exists "Aimer un avis" on public.review_likes;
create policy "Aimer un avis" on public.review_likes
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Ne plus aimer un avis" on public.review_likes;
create policy "Ne plus aimer un avis" on public.review_likes
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- -----------------------------------------------------------------------------
-- Statistiques de la page d'accueil : seuls les livres LUS comptent
-- (on remplace la vue créée par 05-photos-et-accueil.sql)
-- -----------------------------------------------------------------------------
create or replace view public.book_stats
with (security_invoker = true) as
with public_entries as (
  select e.*
  from public.library_entries e
  where e.status = 'lu'
    and exists (select 1 from public.profiles p where p.id = e.user_id)
),
counts as (
  select
    book_id,
    count(*)               as readers,
    count(rating)          as ratings,
    round(avg(rating), 1)  as average,
    case when count(rating) > 0
      then (sum(rating) + 9.0) / (count(rating) + 3)
    end                    as score
  from public_entries
  group by book_id
),
info as (
  select distinct on (book_id) book_id, title, authors, cover_url, genres, year
  from public_entries
  order by book_id, (cover_url is null), created_at
)
select info.*, counts.readers, counts.ratings, counts.average, counts.score
from info
join counts using (book_id);

grant select on public.book_stats to anon, authenticated;
