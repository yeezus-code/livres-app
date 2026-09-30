# Livres — suivi de lectures

Une application web pour noter ses lectures, dans l'esprit de Letterboxd.

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
   heure, ce qui bloquerait les inscriptions. Contrepartie : l'adresse saisie n'est pas
   vérifiée, et « mot de passe oublié » n'existe pas encore (on l'ajoutera avec un vrai
   service d'e-mails).

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

> Sans compte, la bibliothèque est liée au navigateur. En se connectant sur un appareil où
> des livres avaient été ajoutés sans compte, ces livres sont copiés dans le compte.

---

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
| `src/app/page.tsx`                      | page de recherche                                           |
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
