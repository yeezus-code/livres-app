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
import { isRead } from "@/lib/library";
import { fetchLikeCounts } from "@/lib/likes";
import { currentCollections, getCollection } from "@/lib/collections";
import { fetchSuggestions, type Suggestion, type SuggestionShelf } from "@/lib/discover";
import { useI18n } from "@/i18n/I18nProvider";
import { SITE } from "@/lib/site";
import { getSupabase } from "@/lib/supabase";
import { Avatar } from "@/components/Avatar";
import { BookCover } from "@/components/BookCover";
import { BookDialog } from "@/components/BookDialog";
import { BookShelf } from "@/components/BookShelf";
import { CollectionBand, useCollectionBooks, useToday } from "@/components/CollectionBand";
import { EntryDialog } from "@/components/EntryDialog";
import { useLibrary } from "@/components/LibraryProvider";
import { Stars } from "@/components/StarRating";

type Community = { best: BookStats[]; popular: BookStats[]; reviews: Review[] };

export default function HomePage() {
  const router = useRouter();
  const { status, account, entries } = useLibrary();
  const { t, f, r, href, locale, ago, genre, number } = useI18n();
  const [query, setQuery] = useState("");
  const today = useToday();
  const classics = useCollectionBooks("classiques");
  const [releases, setReleases] = useState<Book[] | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionShelf[]>([]);
  const [community, setCommunity] = useState<Community | null>(null);
  const [toAdd, setToAdd] = useState<Book | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [likes, setLikes] = useState<Map<string, number>>(new Map());

  // Les dernières sorties (ne dépendent pas de Supabase)
  useEffect(() => {
    fetch(`/api/nouveautes?lang=${locale}`)
      .then((res) => res.json())
      .then((data) => setReleases(data.books ?? []))
      .catch(() => setReleases([]));
  }, [locale]);

  // « À découvrir » : suggestions calculées d'après la bibliothèque et les abonnements
  const userId = account?.username ? account.id : null;
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !userId) return;
    fetchSuggestions(supabase, userId, entries)
      .then(setSuggestions)
      .catch((e) => console.error("Suggestions :", e));
  }, [userId, entries]);

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

  /** Petite ligne sous une suggestion : « ★★★★★ par @marie » ou « ★ 4,5 » */
  function suggestionNote(item: Suggestion) {
    if (item.kind === "friend") {
      return f(t.home.discoverBy, { stars: "★".repeat(item.rating), name: item.username });
    }
    return item.average !== null
      ? `★ ${number(item.average)}`
      : f(t.home.readersCount, { n: item.readers });
  }

  const readCount = entries.filter(isRead).length;
  const heroCovers = (classics ?? []).filter((b) => b.coverUrl).slice(0, 3);
  const hasCommunity =
    community && (community.best.length || community.popular.length || community.reviews.length);

  return (
    <>
      <section className="hero">
        <div className="hero__content">
          <p className="hero__eyebrow">{f(t.home.eyebrow, { name: SITE.name })}</p>
          <h1 className="hero__title">
            {account?.username
              ? r(t.home.hello, { name: <em>{account.username}</em> })
              : r(t.home.title, { em: <em>{t.home.titleEm}</em> })}
          </h1>
          <p className="hero__text">
            {readCount > 0 ? f(t.home.readCount, { n: readCount }) : t.home.intro}
          </p>
          <form
            className="hero__search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) router.push(`${href("/recherche")}?q=${encodeURIComponent(query.trim())}`);
            }}
          >
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.home.searchPlaceholder}
              aria-label={t.home.searchLabel}
              enterKeyHint="search"
            />
            <button type="submit" className="btn btn--primary">
              {t.home.searchButton}
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
          <h2 className="section-title">{t.home.howTitle}</h2>
          <ol className="how__steps">
            {[
              [t.home.how1Title, t.home.how1Text],
              [t.home.how2Title, t.home.how2Text],
              [t.home.how3Title, t.home.how3Text],
            ].map(([title, text], i) => (
              <li key={title}>
                <span className="how__num">{i + 1}</span>
                <strong>{title}</strong>
                <span className="muted">{text}</span>
              </li>
            ))}
          </ol>
          <p className="center">
            <Link href={href("/compte")} className="btn btn--primary">
              {t.home.createLibrary}
            </Link>
          </p>
        </section>
      )}

      {today &&
        currentCollections(locale, today).map((collection) => (
          <CollectionBand
            key={collection.id}
            collection={collection}
            onSelect={setToAdd}
            eyebrow={t.home.seasonEyebrow}
            showAllLink
          />
        ))}

      {suggestions.length > 0 && (
        <section className="home-section">
          <h2 className="section-title">{t.home.discoverTitle}</h2>
          {suggestions.map((shelf) => (
            <div key={shelf.id} className="discover">
              <h3 className="discover__title">
                {shelf.kind === "friends"
                  ? t.home.discoverFriends
                  : f(t.home.discoverGenre, { genre: genre(shelf.genre).toLowerCase() })}
              </h3>
              <BookShelf
                items={shelf.items.map((item) => ({
                  book: item.book,
                  caption: <span className="muted">{suggestionNote(item)}</span>,
                }))}
                onSelect={setToAdd}
              />
            </div>
          ))}
        </section>
      )}

      {releases !== null && releases.length > 0 && (
        <section className="home-section band">
          <h2 className="section-title">{t.home.releases}</h2>
          <BookShelf items={releases.map((book) => ({ book }))} onSelect={setToAdd} />
        </section>
      )}

      <section className="home-section">
        <h2 className="section-title">{getCollection(locale, "classiques")!.title}</h2>
        <BookShelf
          loading={classics === null}
          items={(classics ?? []).map((book) => ({ book }))}
          onSelect={setToAdd}
        />
        {classics?.length === 0 && (
          <p className="muted small">{t.home.classicsUnavailable}</p>
        )}
      </section>

      {community && community.best.length > 0 && (
        <section className="home-section band">
          <h2 className="section-title">{t.home.bestRated}</h2>
          <BookShelf
            items={community.best.map((s) => ({
              book: statsToBook(s),
              caption: (
                <>
                  <span className="star star--on">★</span>{" "}
                  {s.average === null ? "–" : number(Number(s.average))}{" "}
                  <span className="muted">{f(t.home.ratingsCount, { n: s.ratings })}</span>
                </>
              ),
            }))}
            onSelect={setToAdd}
          />
        </section>
      )}

      {community && community.popular.length > 0 && (
        <section className="home-section">
          <h2 className="section-title">{t.home.popular}</h2>
          <BookShelf
            items={community.popular.map((s) => ({
              book: statsToBook(s),
              caption: (
                <span className="muted">{f(t.home.readersCount, { n: s.readers })}</span>
              ),
            }))}
            onSelect={setToAdd}
          />
        </section>
      )}

      {community && community.reviews.length > 0 && (
        <section className="home-section band">
          <h2 className="section-title">{t.home.latestReviews}</h2>
          <ul className="reviews">
            {community.reviews.map((item) => (
              <li key={item.entry.id}>
                <button className="review-card" onClick={() => setReview(item)}>
                  <BookCover src={item.entry.cover_url} title={item.entry.title} size="sm" />
                  <span className="review-card__body">
                    <span className="review-card__title">{item.entry.title}</span>
                    <span className="small with-avatar">
                      <Avatar url={item.author.avatar_url} username={item.author.username} size={20} />
                      <strong>@{item.author.username}</strong>
                      <Stars value={item.entry.rating} />
                    </span>
                    <span className="review-card__text">
                      {f(t.common.quote, { text: item.entry.review ?? "" })}
                    </span>
                    <span className="small muted">
                      {ago(item.entry.updated_at)}
                      {(likes.get(item.entry.id) ?? 0) > 0 && (
                        <span className="like-count"> · ♥ {likes.get(item.entry.id)}</span>
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
            {t.home.emptyCommunity}{" "}
            {account?.username
              ? t.home.emptyCommunityMember
              : r(t.home.emptyCommunityVisitor, {
                  link: <Link href={href("/compte")}>{t.home.createAccount}</Link>,
                })}
          </p>
        </section>
      )}

      {community && community.reviews.length > 0 && (
        <p className="center">
          <Link href={href("/lecteurs")}>{t.home.discoverReaders}</Link>
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
