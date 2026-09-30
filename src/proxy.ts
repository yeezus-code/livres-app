import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
  localeFromAcceptLanguage,
  localizePath,
} from "@/i18n/config";

// Aiguillage des langues, avant chaque page :
// - /en/…, /es/…, /pt/… : la page dans cette langue ;
// - /fr/… : redirigé vers l'adresse sans préfixe ;
// - sans préfixe : le français, sauf si le visiteur a choisi une autre langue dans le menu
//   (cookie) ou, à sa première visite, si son navigateur est réglé en anglais, espagnol ou portugais.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const first = pathname.split("/")[1];

  if (isLocale(first) && first !== DEFAULT_LOCALE) return NextResponse.next();

  if (first === DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url);
  }

  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  const wanted = isLocale(cookie)
    ? cookie
    : localeFromAcceptLanguage(request.headers.get("accept-language"));
  if (wanted !== DEFAULT_LOCALE) {
    return NextResponse.redirect(new URL(localizePath(wanted, pathname) + search, request.url));
  }

  // Français : la page est rangée en interne sous /fr (dossier src/app/[lang])
  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Ni les routes /api, ni les fichiers internes de Next, ni les fichiers (images, sw.js…)
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
