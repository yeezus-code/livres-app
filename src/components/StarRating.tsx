"use client";

import { useI18n } from "@/i18n/I18nProvider";

const STARS = [1, 2, 3, 4, 5];

/** Affichage en lecture seule : ★★★★☆ */
export function Stars({ value }: { value: number | null }) {
  const { t, f } = useI18n();
  if (!value) return null;
  return (
    <span className="stars" aria-label={f(t.common.starsOutOf5, { n: value })}>
      {STARS.map((n) => (
        <span key={n} aria-hidden="true" className={n <= value ? "star star--on" : "star"}>
          ★
        </span>
      ))}
    </span>
  );
}

/** Saisie de la note : cliquer à nouveau sur la même étoile retire la note. */
export function StarInput({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const { t, f } = useI18n();
  return (
    <div className="star-input" role="radiogroup" aria-label={t.book.ratingOutOf5}>
      {STARS.map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={f(t.book.starLabel, { n })}
          className={value && n <= value ? "star star--on" : "star"}
          onClick={() => onChange(value === n ? null : n)}
        >
          ★
        </button>
      ))}
      <span className="star-input__hint">{value ? `${value}/5` : t.common.noRating}</span>
    </div>
  );
}
