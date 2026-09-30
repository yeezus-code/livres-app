"use client";

import { useEffect, useState } from "react";
import { isInstalled, isIOS, ShareIcon } from "@/components/InstallPrompt";
import { SITE } from "@/lib/site";

type InstallEvent = Event & { prompt: () => Promise<void> };

export default function InstallPage() {
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- lecture de l'appareil, côté navigateur uniquement */
    setInstalled(isInstalled());
    setIos(isIOS());
    /* eslint-enable react-hooks/set-state-in-effect */
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  return (
    <article className="prose install-page">
      <h1 className="page-title">Installer l&apos;appli {SITE.name}</h1>
      <p className="lead">
        {SITE.name} s&apos;installe sur votre téléphone comme une application : une icône sur
        l&apos;écran d&apos;accueil, l&apos;ouverture en plein écran, sans passer par un magasin
        d&apos;applications. C&apos;est gratuit et ça ne prend que quelques secondes.
      </p>

      {installed && <p className="banner">✓ {SITE.name} est déjà installé sur cet appareil.</p>}

      {installEvent && !installed && (
        <p>
          <button className="btn btn--primary" onClick={() => installEvent.prompt()}>
            Installer maintenant
          </button>
        </p>
      )}

      <section className={ios ? "install-steps install-steps--first" : "install-steps"}>
        <h2>Sur iPhone ou iPad</h2>
        <ol>
          <li>
            Ouvrez <strong>{SITE.url.replace("https://", "")}</strong> dans <strong>Safari</strong>.
          </li>
          <li>
            Touchez le bouton <strong>Partager</strong> <ShareIcon />, en bas de l&apos;écran (ou
            en haut sur iPad).
          </li>
          <li>
            Faites défiler et choisissez <strong>« Sur l&apos;écran d&apos;accueil »</strong>, puis{" "}
            <strong>Ajouter</strong>.
          </li>
        </ol>
      </section>

      <section className="install-steps">
        <h2>Sur Android</h2>
        <ol>
          <li>
            Ouvrez <strong>{SITE.url.replace("https://", "")}</strong> dans <strong>Chrome</strong>.
          </li>
          <li>
            Touchez le menu <strong>⋮</strong> en haut à droite.
          </li>
          <li>
            Choisissez <strong>« Installer l&apos;application »</strong> (ou « Ajouter à
            l&apos;écran d&apos;accueil »).
          </li>
        </ol>
      </section>

      <section className="install-steps">
        <h2>Sur ordinateur</h2>
        <p>
          Dans Chrome ou Edge, cliquez sur l&apos;icône d&apos;installation à droite de la barre
          d&apos;adresse (un petit écran avec une flèche), puis sur <strong>Installer</strong>.
        </p>
      </section>

      <p className="muted small">
        L&apos;appli se met à jour toute seule, en même temps que le site. Pour la supprimer :
        appui long sur l&apos;icône, puis « Supprimer ».
      </p>
    </article>
  );
}
