"use client";

import { useEffect, useState } from "react";
import { isInstalled, isIOS, ShareIcon } from "@/components/InstallPrompt";
import { useI18n } from "@/i18n/I18nProvider";
import { SITE } from "@/lib/site";

type InstallEvent = Event & { prompt: () => Promise<void> };

export default function InstallPage() {
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const { t, f, r } = useI18n();
  const site = <strong>{SITE.url.replace("https://", "")}</strong>;

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
      <h1 className="page-title">{f(t.install.title, { name: SITE.name })}</h1>
      <p className="lead">{f(t.install.lead, { name: SITE.name })}</p>

      {installed && <p className="banner">{f(t.install.already, { name: SITE.name })}</p>}

      {installEvent && !installed && (
        <p>
          <button className="btn btn--primary" onClick={() => installEvent.prompt()}>
            {t.install.installNow}
          </button>
        </p>
      )}

      <section className={ios ? "install-steps install-steps--first" : "install-steps"}>
        <h2>{t.install.iosTitle}</h2>
        <ol>
          <li>{r(t.install.ios1, { site, browser: <strong>Safari</strong> })}</li>
          <li>
            {r(t.install.ios2, { share: <strong>{t.install.share}</strong>, icon: <ShareIcon /> })}
          </li>
          <li>
            {r(t.install.ios3, {
              action: <strong>{t.install.ios3Action}</strong>,
              add: <strong>{t.install.ios3Add}</strong>,
            })}
          </li>
        </ol>
      </section>

      <section className="install-steps">
        <h2>{t.install.androidTitle}</h2>
        <ol>
          <li>{r(t.install.ios1, { site, browser: <strong>Chrome</strong> })}</li>
          <li>{r(t.install.android2, { menu: <strong>⋮</strong> })}</li>
          <li>{r(t.install.android3, { action: <strong>{t.install.android3Action}</strong> })}</li>
        </ol>
      </section>

      <section className="install-steps">
        <h2>{t.install.desktopTitle}</h2>
        <p>{r(t.install.desktop, { install: <strong>{t.install.desktopInstall}</strong> })}</p>
      </section>

      <p className="muted small">{t.install.footer}</p>
    </article>
  );
}
