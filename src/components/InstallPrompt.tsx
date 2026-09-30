"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Événement propre à Chrome / Edge / Android : permet d'afficher la fenêtre d'installation
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<unknown> };

const DISMISS_KEY = "codex-install-dismissed";
const DISMISS_DAYS = 30;

/** Codex est-il déjà ouvert comme une appli installée ? */
export function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** iPhone / iPad (y compris les iPad qui se présentent comme des Mac) */
export function isIOS() {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
}

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at > 0 && Date.now() - at < DISMISS_DAYS * 86400000;
  } catch {
    return false;
  }
}

/**
 * 1. Active le « service worker » (écran hors connexion).
 * 2. Sur téléphone, propose d'installer Codex sur l'écran d'accueil (bandeau fermable).
 */
export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [mode, setMode] = useState<"hidden" | "android" | "ios">("hidden");

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((e) => console.error(e));
    }

    const onPrompt = (e: Event) => {
      e.preventDefault(); // on affichera notre propre bouton à la place
      setInstallEvent(e as InstallEvent);
      if (!recentlyDismissed() && window.matchMedia("(pointer: coarse)").matches) {
        setMode("android");
      }
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // Sur iPhone, pas d'installation automatique : on montre comment faire
    if (isIOS() && !isInstalled() && !recentlyDismissed()) {
      const timer = setTimeout(() => setMode("ios"), 2500); // laisse d'abord la page s'afficher
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", onPrompt);
      };
    }
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // navigation privée : tant pis, le bandeau reviendra
    }
    setMode("hidden");
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
    setMode("hidden");
  }

  if (mode === "hidden") return null;

  return (
    <div className="install" role="dialog" aria-label="Installer l'application Codex">
      {/* eslint-disable-next-line @next/next/no-img-element -- petite icône locale */}
      <img src="/icon-192.png" alt="" className="install__icon" />
      <div className="install__text">
        <strong>Codex sur votre écran d&apos;accueil</strong>
        {mode === "android" ? (
          <span>Installez l&apos;appli : plein écran, en un geste.</span>
        ) : (
          <span>
            Touchez <ShareIcon /> puis <b>« Sur l&apos;écran d&apos;accueil »</b>.{" "}
            <Link href="/installer" onClick={dismiss}>
              Aide
            </Link>
          </span>
        )}
      </div>
      {mode === "android" && (
        <button className="btn btn--primary install__btn" onClick={install}>
          Installer
        </button>
      )}
      <button className="install__close" onClick={dismiss} aria-label="Fermer">
        ✕
      </button>
    </div>
  );
}

/** Pictogramme « Partager » d'iPhone (carré et flèche vers le haut) */
export function ShareIcon() {
  return (
    <svg className="share-icon" viewBox="0 0 24 24" aria-label="Partager" role="img">
      <path
        d="M12 3v12M7.5 7.5 12 3l4.5 4.5M8 11H6.5A1.5 1.5 0 0 0 5 12.5v7A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5H16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
