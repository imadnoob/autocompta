# Fonctionnement Détaillé d'AutoCompta

AutoCompta est un écosystème comptable intelligent conçu pour automatiser l'intégralité du cycle financier des entreprises marocaines. Voici une description exhaustive de son fonctionnement technique et fonctionnel, structurée par modules.

---

## 1. Architecture et Cœur IA

L'application repose sur un triptyque technologique de pointe :
- **Vision & Extraction** : Google Gemini 1.5 Flash analyse les documents (PDF/Images) pour en extraire les données structurées.
- **Intelligence Sémantique (RAG)** : Utilisation de `pgvector` dans Supabase pour faire correspondre les descriptions de factures aux comptes du Plan Comptable Marocain (PCM).
- **Interface Réeactive** : Next.js 15 avec un design "Glassmorphism" ultra-premium, offrant une navigation fluide sans rechargement de page.

---

## 2. Étude Détaillée des 4 Modules

### 📊 Module 1 : Tableau de Bord (Pilotage Temps Réel)
Le dashboard n'est pas une simple vue statique, c'est un moteur de calcul dynamique :
- **Calculs à la Volée** : Le module agrège en temps réel les écritures du Grand Livre pour calculer le Chiffre d'Affaires (Classe 7) et les Charges (Classe 6).
- **Visualisations Avancées** :
    - **Évolution Financière** : Graphiques à barres comparant Revenus vs Dépenses mois par mois.
    - **Répartition des Charges** : Un diagramme "Donut" affichant le Top 5 des catégories de dépenses (ex: Achat de marchandises, Électricité, Honoraires).
- **Sélecteur d'Exercice** : Navigation historique permettant de comparer les performances d'une année sur l'autre immédiatement.

### 📂 Module 2 : Gestion Documentaire & OCR (Le Cabinet Numérique)
Ce module transforme le papier en donnée comptable exploitable :
- **Pipeline de Traitement** : Lorsqu'un document est déposé, il passe par plusieurs statuts (`pending` -> `processing` -> `completed`). 
- **OCR Intelligent** : L'IA ne se contente pas de lire le texte, elle identifie les champs métier : ICE du fournisseur, montant HT, taux de TVA (20%, 14%, 10%, 7%), et date de facture.
- **Détection de Doublons** : Un algorithme vérifie automatiquement si un document avec le même fournisseur et le même numéro de facture existe déjà pour éviter les doubles saisies.
- **Nomenclature Automatique** : Les fichiers sont renommés intelligemment (ex: `FAC — MAROC TELECOM — 1,200 MAD`) pour une recherche simplifiée.

### 📖 Module 3 : Comptabilité & États de Synthèse (Le Moteur Fiscal)
C'est le module le plus complexe, gérant la sémantique comptable marocaine :
- **Saisie Automatisée** : En un clic, un document est transformé en une écriture équilibrée dans le journal HA (Achats) ou VT (Ventes).
- **Gestion du Plan Tiers** : Création automatique de comptes auxiliaires (ex: `44110001` pour un nouveau fournisseur) pour un suivi individuel des soldes.
- **Lettrage Comptable** : Système de lettrage (`AA`, `AB`...) permettant de réconcilier une facture avec son paiement bancaire.
- **Multi-Journaux** : Support des journaux HA (Achats), VT (Ventes), BQ (Banque), CA (Caisse) et OD (Opérations Diverses).
- **États de Synthèse Dynamiques** :
    - **Bilan** : Présentation Actif/Passif équilibrée.
    - **CPC** : Calcul du résultat net (Produits - Charges).
    - **Export Sage** : Génération de fichiers `.txt` au format paramétrable Sage pour une intégration directe chez un expert-comptable externe.

### ✨ Module 4 : Agent IA (L'Assistant "Spotlight")
Une interface de type "Claude Chat" qui agit sur votre comptabilité :
- **Tool Calling (19 Outils)** : L'agent peut exécuter des fonctions comme `get_supplier_balance`, `create_journal_entries`, ou `get_tva_report`.
- **Analyse de Documents par Lien** : Vous pouvez cliquer sur un lien généré par l'IA pour traiter une facture directement depuis le chat.
- **Génération d'Artefacts** : L'agent peut répondre avec des graphiques interactifs qui s'ouvrent dans un panneau latéral dédié.
- **Alertes Proactives** : À l'ouverture, l'agent vous informe des factures en retard de paiement ou des anomalies détectées dans la TVA.
- **NLP vers Comptabilité** : Capacité à comprendre des phrases comme "J'ai payé 500 DH de gasoil en espèces ce matin" et à générer l'écriture correspondante en Caisse automatiquement.

---

## 3. Sécurité et Intégrité des Données

- **Row Level Security (RLS)** : Utilisation intensive des politiques Supabase pour garantir que chaque entreprise ne voit que ses propres données.
- **Isolation des Fichiers** : Les documents sont stockés dans des dossiers nommés par l'ID de l'utilisateur, protégés par des clés d'accès temporaires.
- **Audit Trail** : Chaque écriture garde une référence (`doc_id`) vers le document source pour une traçabilité totale en cas de contrôle fiscal.
