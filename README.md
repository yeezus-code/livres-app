# Codex — carnet de lecture

Codex : une application web pour noter ses lectures, dans l'esprit de Letterboxd. (Nom, slogan et adresse de contact : fichier `src/lib/site.ts`.)

**Ce qui existe aujourd'hui**

- Recherche d'un livre par son titre : couverture, auteur(s), année et genre sont récupérés
  automatiquement sur **Open Library**, complétés par **Google Books** quand il manque quelque chose.
- Bibliothèque personnelle : ajouter un livre, lui donner une note sur 5 et écrire un avis,
  modifier ou retirer un livre, trier par date d'ajout, note ou titre.
- Comptes (pseudo, e-mail, mot de passe) : on peut commencer sans compte, puis en créer un
  sans perdre ses livres, et retrouver sa bibliothèque sur tous ses appareils.

- « Mon top » : un classement de 10 livres maximum, dans l'ordre de son choix (on peut
  partir de ses livres les mieux notés).

- Profils publics (`/u/pseudo`) : bibliothèque, notes, avis et top de chaque lecteur.
- Page « Lecteurs » : trouver des lecteurs par pseudo, s'abonner, suivre leur activité.

- Photo de profil (importée depuis son appareil, recadrée et réduite automatiquement).
- Page d'accueil : grands classiques, livres les mieux notés et les plus lus par les
  lecteurs, derniers avis.

Les bibliothèques des comptes sont publiques ; celles des visiteurs sans compte restent privées.

---

## Mise en ligne, pas à pas (sans connaissances en code)

Trois services gratuits travaillent ensemble :

| Service      | Rôle                                                    |
| ------------ | ------------------------------------------------------- |
| **GitHub**   | garde le code de l'application (c'est déjà fait)        |
| **Supabase** | la base de données : c'est là que votre bibliothèque est enregistrée |
| **Vercel**   | héberge le site et lui donne une adresse web            |

Comptez environ 20 minutes.

### Étape 1 — Créer la base de données (Supabase)

1. Allez sur <https://supabase.com>, cliquez **Start your project** et connectez-vous avec GitHub.
2. Cliquez **New project** :
   - *Name* : `livres`
   - *Database Password* : cliquez **Generate a password** (vous n'en aurez pas besoin ensuite,
     mais notez-le quelque part)
   - *Region* : **West EU (Paris)**
   - Cliquez **Create new project**, puis attendez 1 à 2 minutes.
3. Créez la table des livres :
   - Dans le menu de gauche, ouvrez **SQL Editor**.
   - Ouvrez le fichier [`supabase/01-bibliotheque.sql`](supabase/01-bibliotheque.sql) de ce dépôt sur GitHub,
     copiez **tout** son contenu et collez-le dans l'éditeur.
   - Cliquez **Run**. Le message « Success. No rows returned » signifie que c'est bon.

### Étape 2 — Autoriser les visiteurs sans compte

Tant que les comptes n'existent pas, chaque navigateur reçoit une identité « anonyme »
invisible : votre bibliothèque est privée et liée à votre navigateur. Il faut l'autoriser :

1. Menu de gauche : **Authentication** → **Sign In / Providers**
   (selon les versions : *Authentication* → *Providers*, ou *Settings*).
2. Activez l'interrupteur **Allow anonymous sign-ins**, puis **Save changes**.

Puis récupérez les deux valeurs dont Vercel aura besoin :

3. Cliquez sur **Project Settings** (roue dentée en bas à gauche) → **Data API** (ou **API**) :
   copiez la **Project URL** (`https://xxxx.supabase.co`).
4. **Project Settings** → **API Keys** : copiez la **Publishable key** (elle commence par
   `sb_publishable_`). Si vous ne la trouvez pas, ouvrez l'onglet **Legacy API keys** et
   copiez la clé **anon public** (un long texte commençant par `eyJ`) : elle fonctionne aussi,
   à coller dans la même variable Vercel. Autre chemin : le bouton **Connect** en haut de la
   page du projet affiche l'URL et la clé toutes prêtes.

> Ces deux valeurs peuvent être visibles publiquement, ce n'est pas un problème : la sécurité
> est assurée par les règles de la base (chacun ne voit que ses propres livres).
> **Ne copiez jamais** la clé `service_role` / *Secret key*.

### Étape 3 — Mettre le site en ligne (Vercel)

1. Allez sur <https://vercel.com>, cliquez **Sign Up** et choisissez **Continue with GitHub**.
2. Cliquez **Add New…** → **Project**, puis **Import** à côté du dépôt `livres-app`.
   (S'il n'apparaît pas : **Adjust GitHub App Permissions** et autorisez ce dépôt.)
3. Avant de cliquer sur Deploy, ouvrez **Environment Variables** et ajoutez deux lignes :

   | Key                                    | Value                              |
   | -------------------------------------- | ---------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`             | la Project URL copiée à l'étape 2  |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | la Publishable key copiée à l'étape 2 |

4. Cliquez **Deploy**. Au bout de 1 à 2 minutes, Vercel affiche l'adresse de votre site
   (du type `livres-app-xxxx.vercel.app`). Ouvrez-la, y compris sur votre téléphone.

Si vous avez oublié les variables ou fait une faute de frappe : **Settings** →
**Environment Variables** pour corriger, puis **Deployments** → menu « ⋯ » du dernier
déploiement → **Redeploy**.

### Étape 4 (facultative) — Clé Google Books

Sans clé, Google Books limite le nombre de recherches par jour ; Open Library reste utilisé
dans tous les cas, donc la recherche fonctionne quand même. Pour lever la limite :

1. <https://console.cloud.google.com> → créez un projet → **APIs & Services** → **Library** →
   cherchez « Books API » → **Enable**.
2. **APIs & Services** → **Credentials** → **Create credentials** → **API key**, copiez-la.
3. Dans Vercel, ajoutez la variable `GOOGLE_BOOKS_API_KEY` avec cette clé, puis **Redeploy**.

### Vérifier que tout marche

- Tapez un titre (par ex. « L'Étranger ») : des résultats avec couvertures apparaissent.
- Cliquez **Ajouter**, choisissez des étoiles, écrivez un avis, **Ajouter**.
- Ouvrez **Ma bibliothèque** : le livre y est. Rechargez la page : il y est toujours.
- Dans Supabase → **Table Editor** → `library_entries`, vous voyez la ligne correspondante.

Un bandeau en haut de page vous prévient si Supabase n'est pas branché ou si les connexions
anonymes ne sont pas activées.

### Étape 5 — Activer les comptes

1. Dans Supabase → **SQL Editor** → **New query** : copiez tout le contenu de
   [`supabase/02-comptes.sql`](supabase/02-comptes.sql), collez-le, cliquez **Run**.
2. Dans Supabase → **Authentication** → **Sign In / Providers** → **Email** :
   - vérifiez que **Enable Email provider** est activé ;
   - **désactivez « Confirm email »**, puis **Save**.

   Pourquoi ? Le service d'e-mails gratuit de Supabase n'envoie que quelques e-mails par
   heure, ce qui bloquerait les inscriptions. On le réactive à l'étape 9, une fois un vrai
   service d'e-mails branché.

Test : dans l'application, ouvrez **Compte**, créez un compte. Votre pseudo apparaît en haut
à droite, vos livres sont toujours là. Sur votre téléphone, **Compte** → **Se connecter** :
vous retrouvez la même bibliothèque.

### Étape 6 — Activer « Mon top »

Dans Supabase → **SQL Editor** → **New query** : copiez tout le contenu de
[`supabase/03-top.sql`](supabase/03-top.sql), collez-le, cliquez **Run**.

Test : onglet **Top** → **Partir de mes mieux notés** (ou **Composer mon top**), réordonnez
avec ↑ ↓, **Enregistrer**, puis rechargez la page : l'ordre est conservé.

### Étape 7 — Activer les profils publics et les abonnements

Dans Supabase → **SQL Editor** → **New query** : copiez tout le contenu de
[`supabase/04-social.sql`](supabase/04-social.sql), collez-le, cliquez **Run**.

Test : onglet **Compte** → **Voir mon profil public**. Envoyez l'adresse de cette page à
quelqu'un : il voit vos livres, vos notes, vos avis et votre top. Onglet **Lecteurs** :
cherchez un pseudo, ouvrez son profil, **S'abonner** ; ses lectures apparaissent dans
« Activité ».

### Étape 8 — Activer les photos de profil et la page d'accueil

Dans Supabase → **SQL Editor** → **New query** : copiez tout le contenu de
[`supabase/05-photos-et-accueil.sql`](supabase/05-photos-et-accueil.sql), collez-le,
cliquez **Run**. (Ce fichier crée aussi l'espace de stockage des photos : rien à faire
dans le menu Storage.)

Test : onglet **Moi** → **Ajouter une photo**. Page d'accueil : les sections « mieux notés »,
« plus lus » et « derniers avis » se remplissent au fil des notes des lecteurs.

Pour changer la liste des grands classiques : fichier [`src/lib/classics.ts`](src/lib/classics.ts).

### Étape 9 — Brancher un vrai service d'e-mails

Sans cela, Supabase n'envoie que 2 ou 3 e-mails par heure : impossible de proposer
« mot de passe oublié » ou de vérifier les adresses. Choisissez **une** des deux options.

**Option A — Gratuite, sans nom de domaine : Brevo** (300 e-mails par jour)

1. Créez un compte sur <https://www.brevo.com>.
2. Menu **Senders, Domains & Dedicated IPs** → **Senders** → **Add a sender** : saisissez
   votre propre adresse (ex. votre Gmail) et validez-la avec l'e-mail que Brevo vous envoie.
3. Menu **SMTP & API** → onglet **SMTP** → **Generate a new SMTP key**. Notez la clé,
   ainsi que le **Login** affiché sur cette page.
4. Dans Supabase → **Authentication** → **Emails** → onglet **SMTP Settings** → activez
   **Enable custom SMTP** et remplissez :
   - *Sender email* : l'adresse validée à l'étape 2 — *Sender name* : `Livres`
   - *Host* : `smtp-relay.brevo.com` — *Port* : `587`
   - *Username* : le Login de l'étape 3 — *Password* : la clé SMTP de l'étape 3
   - **Save changes**.

   Limite : envoyés « au nom » d'une adresse Gmail, certains e-mails peuvent arriver dans
   les indésirables.

**Option B — Plus fiable, environ 10 € par an : nom de domaine + Resend** (3 000 e-mails par mois)

1. Dans Vercel → **Domains** → **Buy** : achetez un nom (ex. `mes-livres.fr`) puis, dans
   votre projet → **Settings** → **Domains**, ajoutez-le : le site devient accessible à
   cette adresse.
2. Créez un compte sur <https://resend.com> → **Domains** → **Add Domain** → votre domaine.
   Resend affiche 3 ou 4 lignes « DNS » : recopiez-les dans Vercel → **Domains** → votre
   domaine → **DNS Records** → **Add**, puis cliquez **Verify** dans Resend.
3. Resend → **API Keys** → **Create API Key**, copiez la clé.
4. Dans Supabase → **Authentication** → **Emails** → **SMTP Settings** → **Enable custom SMTP** :
   - *Sender email* : `bonjour@votre-domaine` — *Sender name* : `Livres`
   - *Host* : `smtp.resend.com` — *Port* : `465`
   - *Username* : `resend` — *Password* : la clé API
   - **Save changes**.

**Ensuite, dans les deux cas :**

1. Supabase → **Authentication** → **URL Configuration** :
   - *Site URL* : l'adresse de votre site (ex. `https://livres-app.vercel.app`, sans `/` à la fin)
   - *Redirect URLs* → **Add URL** : la même adresse suivie de `/**`
     (ex. `https://livres-app.vercel.app/**`).
2. Supabase → **Authentication** → **Emails** → onglet **Templates** :
   - **Change Email Address** : sujet `Confirmez votre adresse — Livres`, et remplacez tout le
     contenu par celui de [`supabase/emails/confirmer-adresse.html`](supabase/emails/confirmer-adresse.html).
   - **Reset Password** : sujet `Nouveau mot de passe — Livres`, contenu de
     [`supabase/emails/mot-de-passe-oublie.html`](supabase/emails/mot-de-passe-oublie.html).
   - **Save** après chaque modèle.
3. Supabase → **Authentication** → **Rate Limits** : passez *Rate limit for sending emails*
   à `30` par heure, **Save**.
4. Supabase → **Authentication** → **Sign In / Providers** → **Email** : **réactivez
   « Confirm email »**, **Save**. Les nouvelles inscriptions devront cliquer sur le lien reçu.

Test : dans une fenêtre de navigation privée, créez un compte avec une vraie adresse →
l'e-mail arrive → le lien active le compte. Puis **Se connecter** → **Mot de passe oublié ?**

### Étape 10 — Activer la liste « À lire », la date de lecture et les « j'aime »

Dans Supabase → **SQL Editor** → **New query** : copiez tout le contenu de
[`supabase/06-a-lire-dates-jaime.sql`](supabase/06-a-lire-dates-jaime.sql), collez-le,
cliquez **Run**.

### Changer l'adresse du site

- **Gratuit** : Vercel → votre projet → **Settings** → **Domains** → **Add** → saisissez
  par exemple `codex-lecture.vercel.app` (tout nom libre se terminant par `.vercel.app`).
- **Nom de domaine à vous** (≈ 10 €/an) : Vercel → **Domains** → **Buy**, puis ajoutez-le
  au projet de la même façon.
- **Après chaque changement d'adresse**, dans Supabase → **Authentication** →
  **URL Configuration** : mettez la nouvelle adresse dans *Site URL* et ajoutez
  `https://nouvelle-adresse/**` dans *Redirect URLs*. Sinon, les liens des e-mails mèneront
  à l'ancienne adresse.

### Recevoir les messages envoyés à contact@codexby.app

L'adresse de contact affichée sur le site (`src/lib/site.ts`) doit pouvoir recevoir des
e-mails. Le plus simple, gratuit : une **redirection** vers votre boîte Gmail avec ImprovMX.

1. <https://improvmx.com> → saisissez `codexby.app` et votre adresse Gmail → créez le compte.
2. ImprovMX affiche 2 lignes `MX` (`mx1.improvmx.com` priorité 10, `mx2.improvmx.com`
   priorité 20) et 1 ligne `TXT` (`v=spf1 include:spf.improvmx.com ~all`). Ajoutez-les dans
   Vercel → **Domains** → `codexby.app` → **DNS Records**, avec un *Name* **vide** (ou `@`).
   Ces lignes ne gênent pas celles de Resend, qui sont sur `send`.
3. Cliquez **Check again** dans ImprovMX, puis envoyez-vous un e-mail de test à
   contact@codexby.app.

> Sans compte, la bibliothèque est liée au navigateur. En se connectant sur un appareil où
> des livres avaient été ajoutés sans compte, ces livres sont copiés dans le compte.

---

### Modifier les sélections de saison et les dernières sorties

Tout se trouve dans un seul fichier : `src/lib/collections.ts`. Sur GitHub, ouvrez-le,
cliquez sur le crayon ✎, modifiez, puis « Commit changes ». Le site se met à jour en 1 à 2 minutes.

- **Ajouter un livre à une sélection** : copiez une ligne `{ title: "…", author: "…" },`
  dans la bonne sélection et changez le titre et l'auteur. La couverture est trouvée toute seule.
- **Changer les dates d'une saison** : `season: { from: "12-01", to: "12-31" }` (mois-jour).
- **Créer une nouvelle sélection** : copiez un bloc entier `{ id: …, … },`, donnez-lui un
  `id` unique (sans espace ni accent), un titre, des dates et des couleurs.
- **Dernières sorties** : si la liste `NEW_RELEASES` est vide, Codex va chercher tout seul les
  romans en français parus récemment. Pour choisir vous-même, écrivez-y les livres voulus.

Les couvertures d'une sélection sont gardées une semaine en mémoire, les nouveautés une journée :
une modification peut donc mettre jusqu'à ce délai pour apparaître (ou tout de suite après un
nouveau déploiement).

## Pour les développeurs

```bash
cp .env.example .env.local   # puis renseigner les valeurs
npm install
npm run dev                  # http://localhost:3000
```

| Fichier                                 | Rôle                                                        |
| --------------------------------------- | ----------------------------------------------------------- |
| `src/lib/books.ts`                      | recherche Open Library + Google Books, fusion, genres en français |
| `src/app/api/recherche/route.ts`        | `GET /api/recherche?titre=…` appelé par la page de recherche |
| `src/components/LibraryProvider.tsx`    | session anonyme Supabase + lecture/écriture de la bibliothèque |
| `src/components/BookDialog.tsx`         | fenêtre d'ajout / modification (note, avis)                 |
| `src/app/bibliotheque/page.tsx`         | page « Ma bibliothèque »                                    |
| `src/app/globals.css`                   | tout le style (couleurs en haut du fichier)                 |
| `supabase/01-bibliotheque.sql`          | table `library_entries` et règles de sécurité (RLS)         |
| `supabase/02-comptes.sql`               | table `profiles` (pseudos)                                  |
| `src/app/compte/page.tsx`               | création de compte, connexion, déconnexion                  |
| `supabase/03-top.sql`                   | colonne `top_position` et fonction `set_top`                |
| `src/app/top/page.tsx`                  | page « Mon top » (lecture et modification)                  |
| `supabase/04-social.sql`                | lecture publique des bibliothèques, table `follows`         |
| `src/lib/social.ts`                     | profils publics, abonnements, fil d'activité                |
| `src/app/u/[pseudo]/page.tsx`           | profil public d'un lecteur                                  |
| `src/app/lecteurs/page.tsx`             | recherche de lecteurs, abonnements, activité                |
| `supabase/05-photos-et-accueil.sql`     | photos (Storage), vue `book_stats`                          |
| `src/app/page.tsx`                      | page d'accueil                                              |
| `src/app/recherche/page.tsx`            | recherche de livres (`/recherche?q=…`)                      |
| `src/app/api/classiques/route.ts`       | grands classiques (liste dans `src/lib/classics.ts`)        |
| `src/lib/site.ts`                       | nom du site, slogan, présentation, adresse de contact      |
| `src/app/mentions-legales/page.tsx`     | mentions légales                                            |
| `supabase/06-a-lire-dates-jaime.sql`    | statut lu / à lire, date de lecture, table `review_likes`   |
| `src/app/a-lire/page.tsx`               | liste « À lire »                                            |
| `src/lib/avatar.ts`                     | recadrage/réduction des photos avant envoi                  |
