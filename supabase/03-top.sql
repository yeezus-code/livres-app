-- =============================================================================
-- Étape 3 : la page « Mon top »
-- À copier-coller en entier dans Supabase > SQL Editor, puis cliquer « Run ».
-- (Les fichiers 01 et 02 doivent avoir été lancés avant.)
-- =============================================================================

-- Place du livre dans le top (1 = premier), vide s'il n'est pas dans le top
alter table public.library_entries
  add column if not exists top_position smallint check (top_position between 1 and 10);

-- Enregistre tout le top d'un coup, dans l'ordre donné.
-- « security invoker » : la fonction s'exécute avec les droits de la personne,
-- donc les règles de sécurité s'appliquent (on ne touche qu'à ses propres livres).
create or replace function public.set_top(book_ids text[])
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.library_entries
     set top_position = null
   where user_id = auth.uid() and top_position is not null;

  update public.library_entries e
     set top_position = t.pos
    from unnest(book_ids) with ordinality as t(book_id, pos)
   where e.user_id = auth.uid()
     and e.book_id = t.book_id
     and t.pos <= 10;
$$;

revoke execute on function public.set_top(text[]) from public, anon;
grant execute on function public.set_top(text[]) to authenticated;
