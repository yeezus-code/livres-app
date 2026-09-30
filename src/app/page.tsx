"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Book } from "@/lib/books";
import {
  fetchBestRated,
  fetchPopular,
  fetchRecentReviews,
  statsToBook,
  type BookStats,
  type Review,
} from "@/lib/home";
import { timeAgo } from "@/lib/social";
import { isRead } from "@/lib/library";
import { fetchLikeCounts } from "@/lib/likes";
import { SITE } from "@/lib/site";
import { getSupabase } from "@/lib/supabase";
import { Avatar } from "@/components/Avatar";
import { BookCover } from "@/components/BookCover";
import { BookDialog } from "@/components/BookDialog";
import { BookShelf } from "@/components/BookShelf";
import { EntryDialog } from "@/components/EntryDialog";
import { useLibrary } from "@/components/LibraryProvider";
import { Stars } from "@/components/StarRating";

type Community = { best: BookStats[]; popular: BookStats[]; reviews: Review[] };

export default function HomePage() {
  const router = useRouter();
  const { status, account, entries } = useLibrary();
  const [query, setQuery] = useState("");
  const [classics, setClassics] = useState<Book[] | null>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [toAdd, setToAdd] = useState<Book | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [likes, setLikes] = useState<Map<string, number>>(new Map());

  // Les grands classiques (ne dépendent pas de Supabase)
  useEffect(() => {
    fetch("/api/classiques")
      .then((res) => res.json())
      .then((data) => setClassics(data.books ?? []))
      .catch(() => setClassics([]));
  }, []);

  // Ce qui vient des lecteurs de l'application
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || status !== "ready") return;
    Promise.all([fetchBestRated(supabase), fetchPopular(supabase), fetchRecentReviews(supabase)])
      .then(async ([best, popular, reviews]) => {
        setCommunity({ best, popular, reviews });
        setLikes(await fetchLikeCounts(supabase, reviews.map((r) => r.entry.id)));
      })
      .catch((e) => {
        console.error(e); // ex. 05-photos-et-accueil.sql pas encore lancé
        setCommunity({ best: [], popular: [], reviews: [] });
      });
  }, [status]);

  const readCount = entries.filter(isRead).length;
  const heroCovers = (classics ?? []).filter((b) => b.coverUrl).slice(0, 3);
  const hasCommunity =
    community && (community.best.length || community.popular.length || community.reviews.length);

  return (
    <>
      <section className="hero">
        <div className="hero__content">
          <p className="hero__eyebrow">{SITE.name} · carnet de lecture</p>
          <h1 className="hero__title">
            {account?.username ? (
              <>
                Bonjour <em>{account.username}</em>
              </>
            ) : (
              <>
                Vos lectures, vos notes, <em>vos avis</em>.
              </>
            )}
          </h1>
          <p className="hero__text">
            {readCount > 0
              ? `${readCount} livre${readCount > 1 ? "s" : ""} lu${readCount > 1 ? "s" : ""}. Que lisez-vous en ce moment ?`
              : "Retrouvez un livre, donnez-lui une note sur 5, gardez une trace de ce que vous en avez pensé."}
          </p>
          <form
            className="hero__search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) router.push(`/recherche?q=${encodeURIComponent(query.trim())}`);
            }}
          >
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un livre par son titre"
              aria-label="Titre du livre"
              enterKeyHint="search"
            />
            <button type="submit" className="btn btn--primary">
              Chercher
            </button>
          </form>
        </div>

        {/* Trois couvertures en éventail (grands écrans seulement) */}
        {heroCovers.length === 3 && (
          <div className="hero__visual" aria-hidden="true">
            {heroCovers.map((book) => (
              <div key={book.id} className="hero__book">
                <BookCover src={book.coverUrl} title={book.title} />
              </div>
            ))}
          </div>
        )}
      </section>

      {!account?.username && (
        <section className="home-section how">
          <h2 className="section-title">Comment ça marche</h2>
          <ol className="how__steps">
            <li>
              <span className="how__num">1</span>
              <strong>Retrouvez vos livres</strong>
              <span className="muted">
                Tapez un titre : couverture, auteur et genre s&apos;affichent tout seuls.
              </span>
            </li>
            <li>
              <span className="how__num">2</span>
              <strong>Notez et racontez</strong>
              <span className="muted">
                Une note sur 5, un avis, la date de lecture, votre liste « À lire » et votre top.
              </span>
            </li>
            <li>
              <span className="how__num">3</span>
              <strong>Partagez</strong>
              <span className="muted">
                Votre profil public, les lectures de vos amis, les avis qu&apos;on aime.
              </span>
            </li>
          </ol>
          <p className="center">
            <Link href="/compte" className="btn btn--primary">
              Créer sa bibliothèque
            </Link>
          </p>
        </section>
      )}

      <section className="home-section">
        <h2 className="section-title">Les grands classiques</h2>
        <BookShelf
          loading={classics === null}
          items={(classics ?? []).map((book) => ({ book }))}
          onSelect={setToAdd}
        />
        {classics?.length === 0 && (
          <p className="muted small">Les classiques sont momentanément indisponibles.</p>
        )}
      </section>

      {community && community.best.length > 0 && (
        <section className="home-section band">
          <h2 className="section-title">Les mieux notés par nos lecteurs</h2>
          <BookShelf
            items={community.best.map((s) => ({
              book: statsToBook(s),
              caption: (
                <>
                  <span className="star star--on">★</span> {formatAverage(s.average)}{" "}
                  <span className="muted">
                    ({s.ratings} note{s.ratings > 1 ? "s" : ""})
                  </span>
                </>
              ),
            }))}
            onSelect={setToAdd}
          />
        </section>
      )}

      {community && community.popular.length > 0 && (
        <section className="home-section">
          <h2 className="section-title">Les plus lus</h2>
          <BookShelf
            items={community.popular.map((s) => ({
              book: statsToBook(s),
              caption: (
                <span className="muted">
                  {s.readers} lecteur{s.readers > 1 ? "s" : ""}
                </span>
              ),
            }))}
            onSelect={setToAdd}
          />
        </section>
      )}

      {community && community.reviews.length > 0 && (
        <section className="home-section band">
          <h2 className="section-title">Derniers avis</h2>
          <ul className="reviews">
            {community.reviews.map((r) => (
              <li key={r.entry.id}>
                <button className="review-card" onClick={() => setReview(r)}>
                  <BookCover src={r.entry.cover_url} title={r.entry.title} size="sm" />
                  <span className="review-card__body">
                    <span className="review-card__title">{r.entry.title}</span>
                    <span className="small with-avatar">
                      <Avatar url={r.author.avatar_url} username={r.author.username} size={20} />
                      <strong>@{r.author.username}</strong>
                      <Stars value={r.entry.rating} />
                    </span>
                    <span className="review-card__text">« {r.entry.review} »</span>
                    <span className="small muted">
                      {timeAgo(r.entry.updated_at)}
                      {(likes.get(r.entry.id) ?? 0) > 0 && (
                        <span className="like-count"> · ♥ {likes.get(r.entry.id)}</span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {community && !hasCommunity && (
        <section className="home-section">
          <p className="banner">
            Ici apparaîtront les livres les mieux notés et les derniers avis des lecteurs.{" "}
            {account?.username ? (
              <>Notez vos lectures pour lancer le mouvement !</>
            ) : (
              <>
                <Link href="/compte">Créez un compte</Link> et notez vos lectures pour lancer le
                mouvement !
              </>
            )}
          </p>
        </section>
      )}

      {community && community.reviews.length > 0 && (
        <p className="center">
          <Link href="/lecteurs">Découvrir les lecteurs →</Link>
        </p>
      )}

      <EntryDialog
        entry={review?.entry ?? null}
        author={review?.author ?? null}
        onClose={() => setReview(null)}
        onAdd={(book) => {
          setReview(null);
          setToAdd(book);
        }}
      />
      <BookDialog book={toAdd} onClose={() => setToAdd(null)} />
    </>
  );
}

function formatAverage(value: number | null) {
  return value === null ? "–" : Number(value).toLocaleString("fr-FR", { maximumFractionDigits: 1 });
}

