# Livres — suivi de lectures

Une application web pour noter ses lectures, dans l'esprit de Letterboxd.

**Étape 1 (ce qui existe aujourd'hui)**

- Recherche d'un livre par son titre : couverture, auteur(s), année et genre sont récupérés
  automatiquement sur **Open Library**, complétés par **Google Books** quand il manque quelque chose.
- Bibliothèque personnelle : ajouter un livre, lui donner une note sur 5 et écrire un avis,
  modifier ou retirer un livre, trier par date d'ajout, note ou titre.

**À venir** : vrais comptes (e-mail), page « Mon top », profils publics, abonnements.

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
   - Ouvrez le fichier [`supabase/schema.sql`](supabase/schema.sql) de ce dépôt sur GitHub,
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

> Pour l'instant, la bibliothèque est liée au navigateur : sur un autre appareil, ou après
> avoir effacé les données du site, elle apparaît vide. Les comptes (étape suivante)
> régleront cela, et la bibliothèque déjà créée pourra être rattachée au compte.

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
| `supabase/schema.sql`                   | table `library_entries` et règles de sécurité (RLS)         |
