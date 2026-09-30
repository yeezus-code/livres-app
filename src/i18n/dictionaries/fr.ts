// Tous les textes de Codex en français. Les autres langues (en.ts, es.ts, pt.ts)
// reprennent exactement les mêmes clés.
//
// - {n}, {title}… : remplacés par une valeur (nombre, titre du livre…).
// - { one: …, other: … } : singulier et pluriel, choisis d'après {n}.

export const fr = {
  meta: {
    tagline: "Le carnet de lecture qui se partage",
    description:
      "Codex est un carnet de lecture en ligne : retrouvez un livre, donnez-lui une note sur 5, " +
      "écrivez ce que vous en avez pensé, composez votre top et suivez les lectures de vos amis.",
    legalTitle: "Mentions légales",
    ogLocale: "fr_FR",
  },

  common: {
    cancel: "Annuler",
    save: "Enregistrer",
    close: "Fermer",
    edit: "Modifier",
    add: "Ajouter",
    loading: "Chargement…",
    searchBook: "Rechercher un livre",
    justNow: "à l'instant",
    noRating: "Pas de note",
    readOn: "Lu le {date}",
    starsOutOf5: "{n} sur 5",
    coverOf: "Couverture de « {title} »",
    language: "Langue",
    quote: "« {text} »",
  },

  nav: {
    home: "Accueil",
    homeShort: "Accueil",
    search: "Recherche",
    searchShort: "Chercher",
    library: "Bibliothèque",
    libraryShort: "Biblio",
    readers: "Lecteurs",
    readersShort: "Lecteurs",
    account: "Compte",
    accountShort: "Compte",
    me: "Moi",
    homeLabel: "{name}, accueil",
  },

  footer: {
    explore: "Explorer",
    searchBook: "Rechercher un livre",
    selections: "Nos sélections",
    readers: "Lecteurs",
    install: "Installer l'appli",
    legal: "Mentions légales",
    contact: "Contact",
    data: "Données des livres : Open Library et Google Books",
    links: "Liens du pied de page",
  },

  status: {
    unconfigured:
      "La recherche fonctionne, mais la bibliothèque n'est pas encore branchée : il manque les réglages Supabase (voir le README, étape 2).",
    error:
      "Impossible d'ouvrir votre bibliothèque. Vérifiez les réglages Supabase : connexions anonymes activées (README, étape 2) et fichier 02-comptes.sql lancé (étape 5).",
    detail: "Détail : {message}",
  },

  home: {
    eyebrow: "{name} · carnet de lecture",
    hello: "Bonjour {name}",
    title: "Vos lectures, vos notes, {em}.",
    titleEm: "vos avis",
    readCount: {
      one: "{n} livre lu. Que lisez-vous en ce moment ?",
      other: "{n} livres lus. Que lisez-vous en ce moment ?",
    },
    intro:
      "Retrouvez un livre, donnez-lui une note sur 5, gardez une trace de ce que vous en avez pensé.",
    searchPlaceholder: "Titre ou auteur",
    searchLabel: "Titre du livre",
    searchButton: "Chercher",
    howTitle: "Comment ça marche",
    how1Title: "Retrouvez vos livres",
    how1Text: "Tapez un titre : couverture, auteur et genre s'affichent tout seuls.",
    how2Title: "Notez et racontez",
    how2Text: "Une note sur 5, un avis, la date de lecture, votre liste « À lire » et votre top.",
    how3Title: "Partagez",
    how3Text: "Votre profil public, les lectures de vos amis, les avis qu'on aime.",
    createLibrary: "Créer sa bibliothèque",
    seasonEyebrow: "Sélection du moment",
    allSelections: "Toutes les sélections →",
    discoverTitle: "À découvrir pour vous",
    discoverFriends: "Les coups de cœur de vos abonnements",
    discoverGenre: "Parce que vous aimez : {genre}",
    discoverBy: "{stars} par @{name}",
    releases: "Dernières sorties",
    classicsUnavailable: "Les classiques sont momentanément indisponibles.",
    bestRated: "Les mieux notés par nos lecteurs",
    ratingsCount: { one: "({n} note)", other: "({n} notes)" },
    popular: "Les plus lus",
    readersCount: { one: "{n} lecteur", other: "{n} lecteurs" },
    latestReviews: "Derniers avis",
    emptyCommunity: "Ici apparaîtront les livres les mieux notés et les derniers avis des lecteurs.",
    emptyCommunityMember: "Notez vos lectures pour lancer le mouvement !",
    emptyCommunityVisitor: "{link} et notez vos lectures pour lancer le mouvement !",
    createAccount: "Créez un compte",
    discoverReaders: "Découvrir les lecteurs →",
  },

  selections: {
    title: "Nos sélections",
    intro:
      "Au fil de l'année, des livres choisis pour chaque saison : à lire sous la couette, les pieds dans le sable ou au pied du sapin.",
    now: "En ce moment",
  },

  search: {
    title: "Rechercher un livre",
    placeholder: "Titre, auteur ou ISBN",
    label: "Titre, auteur ou ISBN",
    hint: "Tapez un titre, un auteur, ou le numéro ISBN au dos du livre.",
    searching: "Recherche…",
    noResult: "Aucun livre trouvé pour « {query} ».",
    inLibrary: "Dans ma bibliothèque ",
    inToRead: "Dans ma liste « À lire »",
    unavailable: "La recherche est momentanément indisponible. Réessayez dans un instant.",
    notFound: "Livre introuvable ?",
    addManually: "Ajoutez-le à la main",
    manualTitle: "Ajouter un livre à la main",
    manualIntro: "Pour un livre absent de nos sources : il aura une couverture simple avec son titre.",
    manualBookTitle: "Titre",
    manualAuthor: "Auteur",
    manualYear: "Année de parution (facultatif)",
    manualContinue: "Continuer",
  },

  library: {
    title: "Ma bibliothèque",
    sortBy: "Trier par",
    sortRecent: "Ajout récent",
    sortRead: "Date de lecture",
    sortRating: "Meilleure note",
    sortTitle: "Titre (A→Z)",
    anonymousBanner:
      "Sans compte, cette bibliothèque n'existe que sur cet appareil. {link} pour la retrouver partout : vos livres seront conservés.",
    createAccount: "Créez un compte",
    empty: "Aucun livre lu pour l'instant.",
    tabs: "Bibliothèque",
    tabRead: "Lus · {n}",
    tabToRead: "À lire · {n}",
    tabTop: "Mon top",
  },

  toRead: {
    title: "À lire",
    empty:
      "Votre liste est vide. En ajoutant un livre, choisissez « Je veux le lire » pour le garder ici.",
    hint: "Touchez un livre quand vous l'avez lu pour le noter.",
  },

  top: {
    title: "Mon top",
    editTitle: "Modifier mon top",
    emptyLibrary: "Ajoutez d'abord des livres lus à votre bibliothèque pour composer votre top.",
    intro: "Choisissez jusqu'à {n} livres et classez-les à votre goût.",
    fromBest: "Partir de mes mieux notés",
    compose: "Composer mon top",
    emptyDraft: "Ajoutez des livres avec le bouton « + » ci-dessous.",
    moveUp: "Monter « {title} »",
    moveDown: "Descendre « {title} »",
    removeFromTop: "Retirer « {title} » du top",
    addToTop: "Ajouter « {title} » au top",
    saveFailed: "L'enregistrement a échoué. Vérifiez votre connexion et réessayez.",
    myLibrary: "Ma bibliothèque",
    full: "Top complet : {n} livres maximum.",
    tapPlus: "Touchez + pour ajouter un livre au top.",
  },

  book: {
    where: "Où ranger ce livre",
    read: "✓ Je l'ai lu",
    wantToRead: "☆ Je veux le lire",
    yourRating: "Votre note",
    readOnLabel: "Lu le",
    readOnHint: "Facultatif : laissez vide si vous ne savez plus.",
    yourReview: "Votre avis",
    reviewPlaceholder: "Ce que vous en avez pensé… (facultatif)",
    toReadInfo:
      "Le livre rejoint votre liste « À lire ». Quand vous l'aurez lu, rouvrez-le pour le noter.",
    remove: "Retirer",
    confirmRemoveLibrary: "Retirer « {title} » de votre bibliothèque ?",
    confirmRemoveToRead: "Retirer « {title} » de votre liste « À lire » ?",
    addToList: "Ajouter à ma liste",
    doneReading: "C'est lu !",
    communityReaders: { one: "{n} lecteur sur Codex", other: "{n} lecteurs sur Codex" },
    reviewBy: "Avis de",
    inToReadOf: "Dans la liste « À lire » de",
    noReview: "Pas d'avis écrit.",
    myRating: "Ma note",
    addToLibrary: "Ajouter à ma bibliothèque",
    ratingOutOf5: "Note sur 5",
    starLabel: { one: "{n} étoile", other: "{n} étoiles" },
    coverChange: "Changer la couverture",
    coverKeep: "Garder cette couverture",
    coverNone: "Aucune autre couverture trouvée pour ce livre.",
    coverNoImage: "Sans image (couverture avec le titre)",
  },

  like: {
    count: { one: "{n} j'aime", other: "{n} j'aime" },
    signInToLike: "Se connecter pour aimer",
    createAccountHint: "Créez un compte pour aimer les avis",
  },

  account: {
    title: "Mon compte",
    signUp: "Créer un compte",
    signIn: "Se connecter",
    introSignUp: "Un compte permet de retrouver votre bibliothèque sur tous vos appareils.",
    introSignIn: "Connectez-vous pour retrouver votre bibliothèque.",
    introForgot:
      "Indiquez l'adresse de votre compte : vous recevrez un lien pour choisir un nouveau mot de passe.",
    keptOnSignUp: {
      one: "Le livre déjà ajouté sera conservé.",
      other: "Les {n} livres déjà ajoutés seront conservés.",
    },
    copiedOnSignIn: {
      one: "Le livre ajouté sur cet appareil y sera copié.",
      other: "Les {n} livres ajoutés sur cet appareil y seront copiés.",
    },
    forgotTitle: "Mot de passe oublié",
    username: "Pseudo",
    usernamePlaceholder: "ex. marie_lit",
    usernameSavedAs: "Il sera enregistré ainsi : @{name}",
    usernameHint: "Visible par les autres. 3 à 20 caractères : lettres, chiffres ou « _ ».",
    email: "E-mail",
    password: "Mot de passe",
    passwordHint: "Au moins {n} caractères.",
    resetSent:
      "C'est envoyé ! Si un compte existe pour cette adresse, un e-mail arrive dans quelques instants (pensez à regarder dans les indésirables).",
    createMyAccount: "Créer mon compte",
    resendLink: "Renvoyer le lien",
    getLink: "Recevoir le lien",
    forgotLink: "Mot de passe oublié ?",
    backToSignIn: "← Retour à la connexion",
    checkInbox: "Vérifiez votre boîte mail",
    confirmationSent:
      "Un e-mail de confirmation a été envoyé à {email}. Cliquez sur le lien qu'il contient pour activer votre compte.",
    nothingReceived:
      "Rien reçu ? Regardez dans les indésirables, ou renvoyez l'e-mail. En attendant, vous pouvez continuer à utiliser l'application normalement.",
    emailResent: "E-mail renvoyé.",
    resendEmail: "Renvoyer l'e-mail",
    otherAddress: "Utiliser une autre adresse",
    chooseUsername: "Choisissez un pseudo",
    onlyUsernameMissing: "Votre compte est créé, il ne manque que votre pseudo.",
    validate: "Valider",
    statsRead: { one: "{n} livre lu", other: "{n} livres lus" },
    statsRated: { one: "dont {n} noté", other: "dont {n} notés" },
    statsToRead: "{n} à lire",
    publicProfile: "Voir mon profil public",
    installApp: "Installer l'appli sur mon téléphone",
    signOut: "Se déconnecter",
    uploading: "Envoi…",
    changePhoto: "Changer la photo",
    addPhoto: "Ajouter une photo",
    removePhoto: "Retirer la photo",
    changePassword: "Changer mon mot de passe",
    passwordChanged: "Mot de passe changé.",
    newPassword: "Nouveau mot de passe",
  },

  emailLink: {
    checking: "Vérification du lien…",
    confirmedTitle: "Adresse confirmée ✓",
    confirmedText: "Votre compte est activé. Bienvenue !",
    seeAccount: "Voir mon compte",
    passwordSavedTitle: "Mot de passe changé ✓",
    passwordSavedText: "Vous êtes connecté avec votre nouveau mot de passe.",
    myLibrary: "Ma bibliothèque",
    invalidTitle: "Lien invalide",
    invalidHint: "Un lien reçu par e-mail ne fonctionne qu'une fois et pendant une durée limitée.",
    backToAccount: "Retour au compte",
    newPasswordTitle: "Nouveau mot de passe",
    chooseNewPassword: "Choisissez un nouveau mot de passe",
  },

  readers: {
    title: "Lecteurs",
    needAccount:
      "Vous pouvez parcourir les profils, mais pour suivre des lecteurs il faut un compte. {link}",
    createAccount: "Créer un compte",
    myFollowing: "Mes abonnements",
    activity: "Activité",
    followingEmpty: "Vos abonnements n'ont encore rien ajouté.",
    noFollowing: "Abonnez-vous à des lecteurs pour voir ici leurs dernières lectures.",
    hasRead: "a lu",
    wantsToRead: "veut lire",
    find: "Trouver des lecteurs",
    placeholder: "Pseudo, ex. marie_lit",
    label: "Pseudo du lecteur",
    noneFound: "Aucun lecteur trouvé.",
    nobodyYet: "Personne pour l'instant.",
    newest: "Derniers inscrits",
  },

  profile: {
    loadError: "Impossible de charger ce profil. Réessayez plus tard.",
    missing: "Aucun lecteur ne s'appelle « @{name} ».",
    findReader: "Chercher un lecteur",
    read: { one: "lu", other: "lus" },
    rated: { one: "noté", other: "notés" },
    followers: { one: "abonné", other: "abonnés" },
    following: { one: "abonnement", other: "abonnements" },
    itsYou: "C'est vous",
    top: "Top",
    library: "Bibliothèque",
    noBooks: "Aucun livre pour l'instant.",
    wantsToRead: "Envie de lire · {n}",
    follow: "S'abonner",
    followingButton: "Abonné ✓",
    actionFailed: "L'opération a échoué. Réessayez.",
  },

  share: {
    imageEyebrow: "Mon top {n}",
    pageTitle: "Le top {n} de @{name}",
    intro: "Envoyez-le à vos amis ou publiez-le sur vos réseaux.",
    share: "Partager",
    download: "Télécharger l'image",
    copy: "Copier le lien",
    copied: "Lien copié ✓",
    shareText: "Mon top {n} sur Codex",
    empty: "@{name} n'a pas encore composé son top.",
    seeProfile: "Voir le profil de @{name}",
    shareMyTop: "Partager mon top",
    needAccount: "Créez un compte pour partager votre top.",
    imageAlt: "Le top {n} de @{name}",
  },

  install: {
    title: "Installer l'appli {name}",
    lead:
      "{name} s'installe sur votre téléphone comme une application : une icône sur l'écran d'accueil, l'ouverture en plein écran, sans passer par un magasin d'applications. C'est gratuit et ça ne prend que quelques secondes.",
    already: "✓ {name} est déjà installé sur cet appareil.",
    installNow: "Installer maintenant",
    iosTitle: "Sur iPhone ou iPad",
    ios1: "Ouvrez {site} dans {browser}.",
    ios2: "Touchez le bouton {share} {icon}, en bas de l'écran (ou en haut sur iPad).",
    share: "Partager",
    ios3: "Faites défiler et choisissez {action}, puis {add}.",
    ios3Action: "« Sur l'écran d'accueil »",
    ios3Add: "Ajouter",
    androidTitle: "Sur Android",
    android2: "Touchez le menu {menu} en haut à droite.",
    android3: "Choisissez {action} (ou « Ajouter à l'écran d'accueil »).",
    android3Action: "« Installer l'application »",
    desktopTitle: "Sur ordinateur",
    desktop:
      "Dans Chrome ou Edge, cliquez sur l'icône d'installation à droite de la barre d'adresse (un petit écran avec une flèche), puis sur {install}.",
    desktopInstall: "Installer",
    footer:
      "L'appli se met à jour toute seule, en même temps que le site. Pour la supprimer : appui long sur l'icône, puis « Supprimer ».",
    bannerLabel: "Installer l'application Codex",
    bannerTitle: "Codex sur votre écran d'accueil",
    bannerAndroid: "Installez l'appli : plein écran, en un geste.",
    bannerIos: "Touchez {icon} puis {action}.",
    help: "Aide",
    installButton: "Installer",
  },

  legal: {
    title: "Mentions légales",
    whatIs: "{name}, qu'est-ce que c'est ?",
    free:
      "Le site est gratuit, sans publicité et sans pistage. Il est né d'une envie simple : garder une trace de ses lectures et partager ses coups de cœur, à la manière de ce que Letterboxd propose pour le cinéma.",
    publisherTitle: "Éditeur",
    publisher:
      "Ce site est édité par un particulier, à titre non professionnel et non commercial. Contact : {mail}.",
    hostingTitle: "Hébergement",
    hostingSite: "Site : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — vercel.com",
    hostingData:
      "Base de données et fichiers (comptes, bibliothèques, photos) : Supabase Inc., hébergés dans l'Union européenne (région de Paris) — supabase.com",
    hostingEmail: "Envoi des e-mails : Resend Inc. (États-Unis) — resend.com",
    dataTitle: "Données personnelles",
    dataIntro: "Pour faire fonctionner le site, {name} enregistre :",
    dataAccount:
      "si vous créez un compte : votre adresse e-mail, votre mot de passe (chiffré, illisible même pour l'éditeur), votre pseudo et, si vous en ajoutez une, votre photo de profil ;",
    dataBooks: "vos livres, notes, avis, listes et abonnements.",
    dataEmail:
      "Votre adresse e-mail n'est jamais affichée ni transmise à des tiers ; elle sert uniquement à vous connecter et à vous envoyer les e-mails liés à votre compte (confirmation, mot de passe oublié). En revanche, votre pseudo, votre photo et votre bibliothèque (notes et avis compris) sont {public} : c'est le principe du site.",
    public: "publics",
    dataRights:
      "Ces données sont conservées tant que votre compte existe. Conformément au RGPD, vous pouvez à tout moment demander à les consulter, les corriger ou les supprimer, ainsi que la suppression de votre compte, en écrivant à {mail}. Vous pouvez aussi adresser une réclamation à la CNIL (cnil.fr).",
    cookiesTitle: "Cookies",
    cookies:
      "{name} n'utilise aucun cookie publicitaire ni outil de mesure d'audience. Seules des informations techniques indispensables sont enregistrées dans votre navigateur pour garder votre session ouverte et retenir la langue choisie ; elles ne nécessitent pas de consentement.",
    booksTitle: "Livres et couvertures",
    books:
      "Les informations sur les livres (titres, auteurs, couvertures) proviennent d'Open Library et de Google Books. Les couvertures restent la propriété de leurs éditeurs et ayants droit ; elles sont affichées à titre d'illustration. Pour toute demande de retrait, écrivez à {mail}.",
  },

  errors: {
    bucketMissing:
      "Le stockage des photos n'existe pas encore : lancez 05-photos-et-accueil.sql (README).",
    emailSending:
      "L'e-mail n'a pas pu partir : Supabase n'arrive pas à se connecter au service d'envoi. Vérifiez les réglages SMTP (README, étape 9). Détail technique : {message}",
    emailExists: "Un compte existe déjà avec cet e-mail. Utilisez « Se connecter ».",
    invalidCredentials: "E-mail ou mot de passe incorrect.",
    weakPassword: "Mot de passe trop faible : au moins {n} caractères.",
    invalidEmail: "Cette adresse e-mail n'est pas valide.",
    emailNotConfirmed: "Adresse pas encore confirmée : cliquez sur le lien reçu par e-mail.",
    samePassword: "Le nouveau mot de passe doit être différent de l'ancien.",
    reauthenticate: "Par sécurité, reconnectez-vous avant de changer de mot de passe.",
    linkExpired: "Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau.",
    rateLimit: "Trop de tentatives. Patientez quelques minutes puis réessayez.",
    dbOutdated: "La base n'est pas à jour : lancez le dernier fichier SQL du README dans Supabase.",
    tableMissing:
      "La table des comptes n'existe pas encore : lancez 02-comptes.sql (README, étape 5).",
    emailDisabled: "Les comptes par e-mail sont désactivés dans Supabase (README, étape 5).",
    usernameTaken: "Ce pseudo est déjà pris.",
    usernameInvalid:
      "Pseudo : 3 à 20 caractères, lettres sans accent, chiffres ou « _ » uniquement.",
    notImage: "Ce fichier n'est pas une image.",
    imageFormat: "Format d'image non reconnu. Essayez une photo JPEG ou PNG.",
    imagePrepare: "Impossible de préparer l'image.",
    generic: "Une erreur est survenue. Réessayez dans un instant. (Détail technique : {message})",
  },

  // Les genres sont enregistrés en français dans la base ; voici leur nom affiché.
  genres: {
    "Science-fiction": "Science-fiction",
    Fantasy: "Fantasy",
    Horreur: "Horreur",
    Thriller: "Thriller",
    Policier: "Policier",
    Romance: "Romance",
    "BD & manga": "BD & manga",
    Jeunesse: "Jeunesse",
    Poésie: "Poésie",
    Théâtre: "Théâtre",
    Biographie: "Biographie",
    Histoire: "Histoire",
    Philosophie: "Philosophie",
    Psychologie: "Psychologie",
    "Développement personnel": "Développement personnel",
    Économie: "Économie",
    Politique: "Politique",
    Sciences: "Sciences",
    Cuisine: "Cuisine",
    Voyage: "Voyage",
    Art: "Art",
    Religion: "Religion",
    Essai: "Essai",
    Roman: "Roman",
  },
};

/** Forme commune à toutes les langues : une traduction incomplète ne compile pas. */
export type Dictionary = {
  [K in keyof typeof fr]: {
    [L in keyof (typeof fr)[K]]: (typeof fr)[K][L] extends string
      ? string
      : { one: string; other: string };
  };
};
