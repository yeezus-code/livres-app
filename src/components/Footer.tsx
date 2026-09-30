"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALE_COOKIE, LOCALE_NAMES, LOCALES, localizePath, splitLocale, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";
import { getSupabase } from "@/lib/supabase";
import { SITE } from "@/lib/site";
import { LogoMark } from "./LogoMark";

export function Footer() {
  const { t, href } = useI18n();
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div>
          <Link href={href("/")} className="logo">
            <LogoMark size={34} />
            <span className="logo__text">{SITE.name}</span>
          </Link>
          <p className="footer__tagline">{t.meta.tagline}.</p>
        </div>
        <nav aria-label={t.footer.links}>
          <p className="footer__title">{t.footer.explore}</p>
          <ul className="footer__links">
            <li><Link href={href("/recherche")}>{t.footer.searchBook}</Link></li>
            <li><Link href={href("/selections")}>{t.footer.selections}</Link></li>
            <li><Link href={href("/lecteurs")}>{t.footer.readers}</Link></li>
            <li><Link href={href("/installer")}>{t.footer.install}</Link></li>
            <li><Link href={href("/mentions-legales")}>{t.footer.legal}</Link></li>
          </ul>
        </nav>
        <div>
          <p className="footer__title">{t.footer.contact}</p>
          <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
          <LanguagePicker />
        </div>
        <p className="footer__bottom">
          © {new Date().getFullYear()} {SITE.name} · {t.footer.data}
        </p>
      </div>
    </footer>
  );
}

/** Menu de choix de la langue : retient le choix et recharge la même page dans la langue voulue. */
function LanguagePicker() {
  const { t, locale } = useI18n();
  const pathname = usePathname();

  function choose(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    const go = () => {
      window.location.href = localizePath(next, splitLocale(pathname).path) + window.location.search;
    };
    // Les e-mails (confirmation, mot de passe oublié) seront envoyés dans cette langue
    const supabase = getSupabase();
    if (!supabase) return go();
    Promise.race([
      supabase.auth.updateUser({ data: { lang: next } }),
      new Promise((resolve) => setTimeout(resolve, 1500)), // on n'attend pas plus
    ])
      .catch(() => {})
      .finally(go);
  }

  return (
    <label className="lang-picker">
      <span className="footer__title">{t.common.language}</span>
      <select value={locale} onChange={(e) => choose(e.target.value as Locale)}>
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_NAMES[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
