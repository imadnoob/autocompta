# Présentation Détaillée du Site AutoCompta — Bloc par Bloc

Ce document propose une cartographie exhaustive de la plateforme **AutoCompta** (www.autocompta.online), décomposant minutieusement chaque interface visuelle et logique, depuis la page de destination publique jusqu'au cœur mathématique de l'application authentifiée.

---

# PARTIE 1 : LA VITRINE PUBLIQUE (LANDING PAGE)

La page d'accueil d'AutoCompta (accessible à la racine `/`) sert de canal de conversion, de démonstration technique et de vitrine commerciale. Elle utilise une esthétique moderne avec des tons émeraude sur fond clair (slate-50), des effets de flou (backdrop-blur), des dégradés animés et des micro-interactions soignées.

---

## 1.1 Navbar (Barre de Navigation Fixe)

La barre de navigation est **fixée en haut de l'écran** (`position: fixed`) et change d'apparence au scroll : elle passe d'un fond transparent à un fond blanc semi-transparent avec effet de flou (`backdrop-blur-md`) et une bordure fine en bas, accompagnée d'une ombre légère.

**Composition :**
- **À gauche — Le Logo** : Une icône Sparkles (étincelle) dans un carré arrondi vert émeraude clair (`bg-emerald-50`), suivie du texte « Autocompta » en police semi-bold 20px.
- **Au centre — Les Liens d'ancrage** : Deux liens de navigation interne :
  - « Fonctionnalités » (ancre vers `#fonctionnalites`)
  - « Comment ça marche » (ancre vers `#comment-ca-marche`)
- **À droite — Les boutons CTA** :
  - « Connexion » : Lien textuel discret vers `/login`.
  - « S'inscrire » : Bouton plein avec ombre, renvoyant vers `/signup`.
- **Version mobile** : Un bouton hamburger (`Menu`/`X` de Lucide) qui ouvre un panneau déroulant avec les mêmes liens et boutons, animé en slide-up.

---

## 1.2 Hero Section (Section Principale)

La Hero Section est le premier élément visuel massif. Elle occupe toute la hauteur de l'écran (`min-h-screen`) avec un fond `slate-50`.

### Éléments de fond animés
Deux orbes de couleur (émeraude et bleu ciel) se déplacent subtilement en réaction au mouvement de la souris de l'utilisateur — créant un effet parallaxe léger et vivant. Ces cercles sont flous (`blur-3xl`) et semi-transparents (`opacity-50`), en mode `mix-blend-multiply`.

### Contenu textuel centré
1. **Le Badge** : Un petit sticker arrondi au-dessus du titre principal, indiquant « PFE de HILMI IMAD » avec une icône Sparkles.
2. **Le Titre H1** : Typographie très grande et grasse (jusqu'à `text-8xl` sur desktop), décomposé en deux lignes :
   - Première ligne : « La comptabilité »
   - Deuxième ligne : « **automatisée** » — ce mot est en dégradé émeraude animé (shimmer effect : le dégradé se déplace horizontalement en boucle infinie).
3. **Le Sous-titre** : « Transformez vos factures en écritures comptables en quelques secondes grâce à l'intelligence artificielle. Conforme au **Plan Comptable Marocain**. » — le texte "Plan Comptable Marocain" est mis en gras et en noir pour insister sur la conformité réglementaire.
4. **Le Bouton CTA** : « Découvrir la solution » accompagné d'une flèche (`ArrowRight`) qui se déplace vers la droite au survol. Le bouton redirige vers `/signup`.

### Le Mockup Interactif du Dashboard
Sous le texte, une **reproduction fidèle en code React** du véritable tableau de bord est affichée dans un cadre simulant un navigateur web :

- **L'en-tête du navigateur** : Trois points gris (comme macOS), puis une barre d'URL affichant un cadenas (`Shield`) et « autocompta.online ».
- **La barre Agent IA** : Le premier élément dans le faux dashboard — un input avec le placeholder « Posez une question à l'Agent IA... ».
- **L'en-tête de l'app** : Le logo AutoCompta (icône Sparkles sur fond vert), le texte « Bienvenue, Hilmi 👋 », et un bouton « Déconnexion ».
- **Les 4 onglets de navigation** (Dashboard, Documents, Comptabilité, Agent IA) :
  - « Dashboard » est en surbrillance verte (`ring-1 ring-emerald-500`, fond `emerald-50`). Son icône est `LayoutDashboard`.
  - Les trois autres sont en blanc avec des icônes grises (`FileText`, `BookOpen`, `Sparkles`).
- **Les 4 cartes KPI** :
  - **Docs saisis** : Affiche « 53 » avec mention « Mois courant ». Icône `FileText` sur fond bleu.
  - **Dépenses** : Affiche « 132.336 MAD ». Icône flèche rose sur fond rose.
  - **Revenus** : Affiche « 245.890 MAD ». Icône flèche verte sur fond vert.
  - **Période** : Affiche « 2026 » avec des boutons `<` et `>` pour naviguer entre les années. Fond sombre.
- **Les graphiques** :
  - **Graphique en barres** (2/3 de largeur) : « Évolution Financière — Dépenses vs Revenus — 2026 (MAD) ». 12 mois avec des barres rose (dépenses) et verte (revenus).
  - **Graphique Donut** (1/3 de largeur) : « Par Catégorie — Top 4 — 2026 ». Quatre segments colorés (rose, ambre, émeraude, indigo) avec légende (Achats 52K, Services 39K, Impôts 20K, Personnel 20K).

---

## 1.3 Section « Comment ça marche ? » (How It Works)

Cette section a un fond `slate-100` avec des orbes décoratives floues en arrière-plan (émeraude, bleu). Elle utilise la librairie **Framer Motion** pour des animations fluides.

### En-tête
- Badge : « Le Processus » (fond blanc, texte émeraude, majuscules).
- Titre H2 géant : « Votre comptabilité en **4 étapes simples** » — le texte "4 étapes simples" est animé avec un dégradé qui se déplace (du vert émeraude au bleu).
- Sous-titre : « De la facture papier à l'écriture comptable. Un workflow automatisé conçu pour la conformité et l'excellence au Maroc. »

### Les 4 Onglets de Navigation
Une barre d'onglets **glassmorphism** (`backdrop-blur-xl`, fond blanc semi-transparent) avec 4 boutons :
1. **01. Archivage** — L'onglet actif a un fond noir avec texte blanc (animation `layoutId` de Framer Motion pour une transition fluide du fond noir entre les onglets).
2. **02. Comptabilité**
3. **03. Agent IA**
4. **04. Pilotage**

### Le Carrousel Interactif
Chaque étape affiche un bloc en deux colonnes dans un conteneur glassmorphism (`backdrop-blur-3xl`, coins très arrondis de `3rem`) avec une texture de bruit (grain SVG en overlay) :

**Colonne Gauche — Le Contenu Textuel :**
- Numéro de l'étape dans un carré coloré + icône dans un carré blanc.
- Titre en `text-5xl`, description détaillée.
- Liste de 4 points forts avec des barres colorées verticales qui s'animent au survol.
- Bouton CTA vert « Explorer l'étape suivante » (ou « Lancez-vous maintenant » à la dernière).

**Colonne Droite — Le Visuel Mockup :**
Chaque étape possède son propre mockup haute fidélité (rendu à 50% de sa taille réelle via `scale-50` dans un conteneur `200%`) :

- **Étape 01 (Archivage)** : Simulation du module Documents avec zone d'upload drag & drop à gauche, barre de recherche + filtres (Tous, À saisir, Saisi, Lettré, Réglé) + liste de documents à droite.
- **Étape 02 (Comptabilité)** : Simulation du module Comptabilité avec ses sous-onglets (À saisir, Journal, Grand Livre, Balance, Plan Tiers, Bilan & CPC) et deux panneaux : "À comptabiliser" et "Texte vers écritures" (avec bouton IA indigo).
- **Étape 03 (Agent IA)** : Simulation d'une conversation de chat — messages utilisateur (« Comptabilise les factures non saisies ») et réponses de l'agent (avec liens cliquables vers les documents traités). Barre d'input avec trombone et bouton envoi bleu.
- **Étape 04 (Pilotage)** : Simulation du Dashboard avec les 4 cartes KPI, le graphique en barres et le graphique Donut.

### Contrôles de Navigation
En bas du carrousel :
- Flèches gauche/droite (`ChevronLeft`/`ChevronRight`) dans des boutons carrés blancs.
- Compteur « 01 / 04 » en fonte monospace.
- Indicateurs de progression : barres horizontales, la barre active est plus large et verte.

---

## 1.4 Section « Fonctionnalités Clés » (Features)

Fond blanc, section à ancre `#fonctionnalites`.

### En-tête
- Badge : « Comptabilité par IA » (fond vert clair, texte vert, majuscules, espacement de lettres très large).
- Titre H2 : « Un workflow simplifié, **une rigueur absolue.** » — le texte en gras utilise le même effet shimmer émeraude.

### Les 3 Colonnes d'Arguments
Grille de 3 colonnes sur desktop, chacune composée de :
1. **Une barre horizontale animée** : Au repos, elle est grise (`slate-100`). Au survol, une barre verte la remplit de gauche à droite (transition de 700ms).
2. **Icône + Titre** : Icône Lucide (Zap, Shield, Target) en vert + titre en majuscules avec espacement très large (`tracking-[0.3em]`) en gris.
3. **Sous-titre en gras** : Texte accrocheur en `text-3xl`.
4. **Description** : Paragraphe explicatif en gris.

Les 3 arguments sont :
- ⚡ **Rapidité** — « Saisie instantanée par l'IA. » — De la facture papier au journal comptable en moins de 3 secondes.
- 🛡️ **Conformité** — « Rigueur PCM native. » — Respect rigoureux du Plan Comptable Marocain.
- 🎯 **Efficacité** — « Adieu les tâches répétitives. » — Centralisation, automatisation, pilotage en temps réel.

Au survol, chaque colonne s'agrandit légèrement (`scale-[1.02]`).

---

La landing page se termine après la section « Comment ça marche ? ». Il n'y a pas de section Tarification ni de Footer sur la page actuelle — l'objectif est de diriger l'utilisateur directement vers l'inscription (`/signup`) ou la connexion (`/login`) via les boutons CTA.

---

# PARTIE 2 : LA PLATEFORME AUTHENTIFIÉE (WEB APP)

Après connexion (via `/login` ou `/signup`, authentification gérée par **Supabase Auth**), l'utilisateur accède à l'interface applicative sur `/dashboard`. L'UX passe d'une vitrine commerciale à un **outil métier** épuré, sur fond `slate-50` très clair.

---

## 2.1 En-tête Applicatif et Navigation par Modules

### L'en-tête
- **Logo AutoCompta** : Icône `Sparkles` blanche dans un carré arrondi vert émeraude (`from-emerald-500 to-emerald-600`) avec un **effet shimmer** animé (une bande de lumière qui traverse l'icône en boucle).
- **Texte** : « **AutoCompta** » en gras 2xl, suivi de « Bienvenue, HILMI IMAD 👋 » (le nom est récupéré dynamiquement depuis la session Supabase).
- **Bouton Déconnexion** : À droite, texte « Déconnexion » avec icône flèche sortante.

### Les 4 Modules de Navigation
Une grille de 4 cartes cliquables (responsive : 1 colonne mobile → 4 colonnes desktop) :

| Module | Icône | Couleur icône | Description |
|---|---|---|---|
| **Dashboard** | `LayoutDashboard` | Vert (`emerald`) | Vue d'ensemble |
| **Documents** | `FileText` | Bleu (`blue`) | Archivage & Classification |
| **Comptabilité** | `BookOpen` | Indigo (`indigo`) | Saisie & Lettrage |
| **Agent IA** | `Sparkles` | Violet (`violet`) | Assistant Intelligent |

Le module actif est entouré d'une bordure verte (`ring-1 ring-emerald-500`) avec un fond légèrement teinté. L'icône du module actif est mise en couleur tandis que les autres restent grises.

---

## 2.2 Module « Dashboard » — Vue d'Ensemble

Ce module constitue un **moteur de calcul analytique interactif** qui s'actualise en temps réel depuis la base de données Supabase (tables `documents` et `journal_entries`).

### Rangée des 4 Cartes KPI

1. **DOCS SAISIS** (fond blanc, icône verte `FileText`) :
   - Nombre de documents comptabilisés au mois courant (calculé dynamiquement).
   - Mention « ↗ Mois courant » en bas.

2. **DÉPENSES (ACHATS)** (fond blanc, icône rose `ArrowDownRight`) :
   - Somme de toutes les écritures des comptes de la classe 6 et 2 (Charges et Immobilisations).
   - Affichage en format monétaire MAD.
   - Mention « Total comptabilisé ».

3. **REVENUS (VENTES)** (fond blanc, icône bleu ciel `ArrowUpRight`) :
   - Somme de toutes les écritures des comptes de la classe 7 (Produits).
   - Affichage en format monétaire MAD.
   - Mention « Total comptabilisé ».

4. **ANNÉE** (fond noir `slate-900`, décor émeraude flou en coin) :
   - Sélecteur d'année avec flèches `<` et `>` permettant de naviguer entre les exercices fiscaux disponibles.
   - Mention « Filtrer les graphiques ».
   - Ce sélecteur **contrôle dynamiquement** les deux graphiques en dessous.

### Les Graphiques (libraire Recharts)

**Graphique en Barres — « Évolution Financière »** (2/3 de largeur) :
- Axe X : 12 mois (Jan à Déc).
- Deux séries de barres par mois :
  - **Rose** (`#f43f5e`) : Dépenses.
  - **Vert** (`#10b981`) : Revenus.
- Légende avec pastilles colorées.
- Tooltip personnalisé au survol (fond blanc, bordure, montants en MAD).
- Grille horizontale en pointillés.
- Barres à coins arrondis (`radius: [4,4,0,0]`).

**Graphique Donut — « Dépenses par Catégorie »** (1/3 de largeur) :
- Diagramme circulaire creux (donut) avec 5 segments colorés (émeraude, bleu, indigo, ambre, violet, rose).
- Au centre du donut : texte « Total » + montant compact (ex: « 110K »).
- Légende en dessous : les 5 catégories avec pastille colorée + montant en MAD.
- Les catégories sont calculées à partir des noms de comptes (account_name) des écritures de classe 6.

---

## 2.3 Module « Documents » — La Tour de Contrôle OCR

Ce module est divisé en **deux zones** :

### Zone Gauche — L'Uploader
Un panneau « Télécharger » avec :
- Icône d'upload.
- Zone en pointillés (bordered dashed) : « Cliquez ou glissez un fichier — PDF, PNG, JPG — Max 10 Mo ».
- Au clic ou au drag & drop, le fichier est envoyé à l'API `/api/process-document` qui invoque le modèle **Google Gemini 3 Flash Preview** pour l'extraction OCR.

### Zone Droite — L'Historique des Documents
- **Barre de recherche** : « Rechercher par nom, fournisseur... » avec icône loupe.
- **Filtres déroulants** : « Tous les types », « Toutes les dates », « Plus ».
- **Pills de statut** : Filtres rapides sous forme de badges cliquables :
  - **Tous** (vert, actif par défaut)
  - **À saisir** (orange) — document extrait mais pas encore imputé.
  - **Saisi** (bleu) — écriture comptable générée.
  - **Lettré** (indigo) — rapprochement effectué.
  - **Doublon** (rouge) — détecté comme doublon par l'algorithme anti-doublons.
- **Tri** : Dropdown « Trier : Date ajout ▼ » avec flèche de direction.
- **Liste des documents** : Chaque ligne affiche :
  - Référence unique (`[AC-2026-0005]`).
  - Type + Fournisseur + Date + Montant.
  - Badges de statut (ex: « ⚠ Doublon » en rouge, « ✓ Archivé » en vert, « Saisi » en bleu).
  - Flèche de navigation `→`.

---

## 2.4 Module « Comptabilité » — Le Cœur Mathématique

Le module le plus riche de la plateforme. Il dispose de sa propre **barre d'onglets secondaire** avec 7 sous-modules :

### 2.4.1 Onglet « À saisir » (badge compteur)
- Titre : « Documents à comptabiliser » + compteur « X/Y en attente ».
- Barre de recherche : « Rechercher fournisseur, réf, n° facture… ».
- Filtres : « Tous types » + « Trier par date ▼ » + bouton « Filtres ».
- **Tableau** avec colonnes : RÉF. | DATE | FOURNISSEUR | HT | TVA | TTC.
- Chaque ligne est une facture en attente de validation comptable.
- En dessous : bloc « ✨ Texte → Écritures comptables » permettant de coller du texte brut et de laisser l'IA Gemini générer automatiquement les écritures.

### 2.4.2 Onglet « Journal » (badge « 8 »)
- Titre : « Journal des écritures » + compteur « 8 écritures ».
- **Filtres par type de journal** (badges cliquables) :
  - **Tous** (noir, actif)
  - **Achats** (avec emoji)
  - **Banque**
  - **Caisse**
  - **OD** (Opérations Diverses)
- **Boutons d'export** (en haut à droite) :
  - « Excel » (fond vert clair, icône tableur) → export XLSX via la librairie `xlsx`.
  - « Sage (TXT) » (fond rose clair, icône téléchargement) → export au format PNM compatible Sage.
  - « PDF » (fond gris, icône téléchargement) → export PDF via `jsPDF` + `jspdf-autotable`.
- **Barre de recherche** + **Filtre par mois** (`input type="month"`).
- **Colonnes du tableau** : JOUR. | N° PIÈCE | DATE | RÉF. | N° COMPTE | LIBELLÉ | LETTRAGE | DÉBIT | CRÉDIT | ACTIONS.
- Les numéros de compte (ex: `34552`) sont affichés dans des badges colorés cliquables.
- **Actions par ligne** : Bouton aperçu (👁), bouton annuler (↩), bouton modifier (✏), bouton supprimer (🗑).

### 2.4.3 Onglet « Grand Livre »
- Disposition en **deux colonnes** :
  - **Colonne gauche** : Liste des comptes avec leur solde et une flèche de tendance (↗ ou ↘).
    - Exemples : 34552 TVA récupérable (22 986,00) / 4411 Fournisseurs (244 836,00) / 61241 Charges d'exploitation (110 280,00).
  - **Colonne droite** : Au clic sur un compte → affichage du détail de toutes les écritures de ce compte.
  - Message par défaut : « Sélectionnez un compte à gauche pour voir le détail des écritures ».
- **Barre de recherche** + **Filtre par mois**.

### 2.4.4 Onglet « Balance »
- Titre : « Balance Générale » + compteur « 5 comptes ».
- **Filtres par période** : « DU jj/mm/aaaa AU jj/mm/aaaa » (deux sélecteurs de date).
- **Colonnes** : N° COMPTE | LIBELLÉ | RAN DÉBIT | RAN CRÉDIT | MVT DÉBIT | MVT CRÉDIT | SOLDE FIN D. | SOLDE FIN C.
- Exemples de lignes :
  - 34552 — TVA récupérable sur charges — MVT Débit : 22 986,00 — Solde Fin D. : 22 986,00
  - 4411 — Fournisseurs — MVT Crédit : 244 836,00 — Solde Fin C. : 244 836,00
  - 61241 — Charges d'exploitation — MVT Débit : 110 280,00 — Solde Fin D. : 110 280,00
- Les numéros de compte sont des badges cliquables qui redirigent vers le Grand Livre filtré.

### 2.4.5 Onglet « Plan Tiers »
- Gestion des comptes auxiliaires fournisseurs (4411) et clients (3421).
- Création et alimentation dynamique des comptes de tiers.

### 2.4.6 Onglet « Bilan & CPC »
Cet onglet contient **deux sous-onglets** :

**Sous-onglet « Bilan » :**
- Barre d'outils : Recherche + Filtre mois + Sélecteur d'année (avec `<` `>`) + Bouton « + Ajustements ».
- **3 cartes récapitulatives** en haut :
  - « Total Actif » : ex. **137 916,00 MAD**
  - « Total Passif » : ex. **253 836,00 MAD**
  - « Résultat Net » : **Bénéfice** (fond vert) ou Déficit (fond rouge)
- **Deux tableaux côte à côte** :
  - **ACTIF** (icône ↗) : Avec sections « ACTIF IMMOBILISÉ », « ACTIF CIRCULANT », « TRÉSORERIE ». Colonnes : COMPTE | LIBELLÉ | MONTANT.
  - **PASSIF** (icône ↘) : Avec sections « FINANCEMENT PERMANENT », « PASSIF CIRCULANT », « TRÉSORERIE PASSIF ». Colonnes : COMPTE | LIBELLÉ | MONTANT.
- Les lignes sont **triées automatiquement par numéro de compte** au sein de chaque rubrique (ex: 3111 Marchandises → 3421 Clients → 34552 TVA).

**Sous-onglet « CPC » :**
- Le Compte de Produits et Charges est calculé dynamiquement.
- Il établit le résultat financier de l'exercice (Bénéfice ou Perte).

### 2.4.7 Onglet « Décl. TVA » (Déclaration TVA)
- Titre : « Déclaration TVA ».
- **Sélecteur de période** (dropdown) avec les options :
  - « Toutes les périodes »
  - « 📅 Mois en cours »
  - « 📊 Trimestre en cours (T1/T2/T3/T4) »
  - « 📆 Année XXXX »
- **3 cartes récapitulatives** :
  - « TVA Facturée (Sur Ventes) » : Montant en MAD.
  - « TVA Récupérable (Sur Achats) » : ex. **22 986,00 MAD**.
  - « CRÉDIT DE TVA (À REPORTER) » ou « TVA DUE (À PAYER) » : Calcul automatique. Fond vert clair pour crédit, rouge pour dû.
- **Tableau « État de la TVA par Période »** :
  - Son propre dropdown de filtre de période.
  - Colonnes : PÉRIODE | BASE HT VENTES | TVA FACTURÉE | BASE HT ACHATS | TVA RÉCUP. | TVA NETTE (DUE).
  - Lignes groupées par mois (ex: « Mai 2021 »).

---

## 2.5 Module « Agent IA » — L'Assistant Comptable

L'interface est une **application de chat** en pleine page, avec une esthétique bleue/violet.

### Zone Gauche — La Sidebar
- Bouton « Nouveau Chat » (avec icône +) pour démarrer une nouvelle conversation.
- Historique des conversations précédentes (si applicable).

### Zone Centrale — Le Chat
- **Message d'accueil** : Icône Sparkles violette (`bg-violet-500`) dans un carré arrondi, suivi de « **Bonjour, je suis votre Agent.** » en gras, puis « Posez-moi des questions sur votre comptabilité ou demandez-moi de traiter vos factures. »
- **Barre d'input** en bas : « Posez une question à votre expert comptable... » avec icône trombone (`Paperclip`) pour joindre des fichiers et bouton d'envoi (`Send`).
- **Avertissement** sous l'input : « L'Agent IA peut commettre des erreurs. Vérifiez les écritures. »

### Fonctionnement Technique (Tool Calling)
L'Agent utilise la technologie **Tool Calling** de Google Gemini. Il dispose de près d'une vingtaine d'outils programmatiques internes lui permettant de :
- Lire les tables Supabase (documents, journal_entries, etc.).
- Créer des écritures comptables sur simple demande en langage naturel.
- Générer des rapports de TVA.
- Consulter le solde d'un fournisseur.
- Produire des graphiques directement dans le chat.

Exemples de requêtes : « Comptabilise les factures non saisies », « C'est quoi le solde du fournisseur BELATHERM ? », « Génère le rapport de TVA du mois de mars », « J'ai payé 500 DH d'entretien en espèces ce matin ».

---

# PARTIE 3 : SYNTHÈSE TECHNOLOGIQUE

| Couche | Technologie |
|---|---|
| **Frontend** | React 19 / Next.js 16 (App Router, Turbopack) |
| **Styling** | Tailwind CSS 4 |
| **Animations** | Framer Motion (motion/react) |
| **Graphiques** | Recharts (BarChart, PieChart, LineChart) |
| **Backend / BDD** | Supabase (PostgreSQL, Auth, Storage, RLS) |
| **IA Générative** | Google Gemini 3 Flash Preview (extraction OCR, Agent IA, Tool Calling) |
| **IA Embeddings** | Gemini Embedding 001 (base vectorielle PCM, architecture RAG) |
| **Exports** | xlsx (Excel), jsPDF + jspdf-autotable (PDF), format PNM (Sage TXT) |
| **Icônes** | Lucide React |
| **Hébergement** | Docker + Vercel (autocompta.online) |
