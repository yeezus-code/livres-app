"use client";

import { useState } from "react";
import type { Book } from "@/lib/books";
import { isInSeason, seasonalCollections } from "@/lib/collections";
import { BookDialog } from "@/components/BookDialog";
import { CollectionBand, useToday } from "@/components/CollectionBand";
import { useI18n } from "@/i18n/I18nProvider";

export default function SelectionsPage() {
  const [toAdd, setToAdd] = useState<Book | null>(null);
  const today = useToday();
  const { t, locale } = useI18n();

  return (
    <>
      <h1 className="page-title">{t.selections.title}</h1>
      <p className="muted selections-intro">{t.selections.intro}</p>
      {today &&
        seasonalCollections(locale, today).map((collection, i) => (
          <CollectionBand
            key={collection.id}
            collection={collection}
            onSelect={setToAdd}
            eyebrow={isInSeason(collection, today) ? t.selections.now : undefined}
            delay={i > 1 ? (i - 1) * 1500 : 0}
          />
        ))}
      <BookDialog book={toAdd} onClose={() => setToAdd(null)} />
    </>
  );
}
