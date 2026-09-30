"use client";

import { useState } from "react";
import type { Book } from "@/lib/books";
import { isInSeason, seasonalCollections } from "@/lib/collections";
import { BookDialog } from "@/components/BookDialog";
import { CollectionBand, useToday } from "@/components/CollectionBand";

export default function SelectionsPage() {
  const [toAdd, setToAdd] = useState<Book | null>(null);
  const today = useToday();

  return (
    <>
      <h1 className="page-title">Nos sélections</h1>
      <p className="muted selections-intro">
        Au fil de l&apos;année, des livres choisis pour chaque saison : à lire sous la couette,
        les pieds dans le sable ou au pied du sapin.
      </p>
      {today &&
        seasonalCollections(today).map((collection, i) => (
          <CollectionBand
            key={collection.id}
            collection={collection}
            onSelect={setToAdd}
            eyebrow={isInSeason(collection, today) ? "En ce moment" : undefined}
            delay={i > 1 ? (i - 1) * 1500 : 0}
          />
        ))}
      <BookDialog book={toAdd} onClose={() => setToAdd(null)} />
    </>
  );
}
