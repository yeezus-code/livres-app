"use client";

const STARS = [1, 2, 3, 4, 5];

/** Affichage en lecture seule : ★★★★☆ */
export function Stars({ value }: { value: number | null }) {
  if (!value) return null;
  return (
    <span className="stars" aria-label={`${value} sur 5`}>
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
  return (
    <div className="star-input" role="radiogroup" aria-label="Note sur 5">
      {STARS.map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
          className={value && n <= value ? "star star--on" : "star"}
          onClick={() => onChange(value === n ? null : n)}
        >
          ★
        </button>
      ))}
      <span className="star-input__hint">{value ? `${value}/5` : "Pas de note"}</span>
    </div>
  );
}
