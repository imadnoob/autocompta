-- ============================================================
-- Migration: Sage-Compatible Features
-- Exercice comptable, journal enrichment, tiers enrichment
-- Run this in Supabase SQL Editor
-- ============================================================

-- ─── 1. Exercice Comptable ───────────────────────────────────
CREATE TABLE IF NOT EXISTS exercice_comptable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    label TEXT NOT NULL,             -- ex: "Exercice 2025", "Exercice 2026"
    date_debut DATE NOT NULL,        -- ex: 2026-01-01
    date_fin DATE NOT NULL,          -- ex: 2026-12-31
    is_current BOOLEAN DEFAULT false,
    is_closed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for exercice_comptable
ALTER TABLE exercice_comptable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exercices"
    ON exercice_comptable FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own exercices"
    ON exercice_comptable FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own exercices"
    ON exercice_comptable FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own exercices"
    ON exercice_comptable FOR DELETE USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_exercice_user ON exercice_comptable(user_id);
CREATE INDEX IF NOT EXISTS idx_exercice_current ON exercice_comptable(user_id, is_current);


-- ─── 2. Journal Entries Enrichment ───────────────────────────
-- Add entry status (brouillard → validé → clôturé)
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS entry_status TEXT DEFAULT 'brouillard'
    CHECK (entry_status IN ('brouillard', 'valide', 'cloture'));

-- Add échéance date 
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS echeance_date DATE;

-- Add exercice reference
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS exercice_id UUID REFERENCES exercice_comptable(id);

-- Index for status and echeance
CREATE INDEX IF NOT EXISTS idx_je_status ON journal_entries(entry_status);
CREATE INDEX IF NOT EXISTS idx_je_echeance ON journal_entries(echeance_date);


-- ─── 3. Tiers Enrichment ─────────────────────────────────────
-- Add rich fields to existing tiers table
ALTER TABLE tiers ADD COLUMN IF NOT EXISTS adresse TEXT;
ALTER TABLE tiers ADD COLUMN IF NOT EXISTS ville TEXT;
ALTER TABLE tiers ADD COLUMN IF NOT EXISTS code_postal TEXT;
ALTER TABLE tiers ADD COLUMN IF NOT EXISTS rc TEXT;                        -- Registre de commerce
ALTER TABLE tiers ADD COLUMN IF NOT EXISTS identifiant_fiscal TEXT;        -- IF
ALTER TABLE tiers ADD COLUMN IF NOT EXISTS ice TEXT;                       -- Identifiant commun d'entreprise
ALTER TABLE tiers ADD COLUMN IF NOT EXISTS telephone TEXT;
ALTER TABLE tiers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE tiers ADD COLUMN IF NOT EXISTS delai_reglement_jours INTEGER DEFAULT 30;
ALTER TABLE tiers ADD COLUMN IF NOT EXISTS mode_reglement TEXT DEFAULT 'virement'
    CHECK (mode_reglement IN ('virement', 'cheque', 'especes', 'effet', 'prelevement'));
ALTER TABLE tiers ADD COLUMN IF NOT EXISTS jour_tombee INTEGER;           -- ex: 10 = le 10 du mois
ALTER TABLE tiers ADD COLUMN IF NOT EXISTS condition_reglement TEXT DEFAULT 'net'
    CHECK (condition_reglement IN ('net', 'fin_mois', 'fin_mois_le'));
ALTER TABLE tiers ADD COLUMN IF NOT EXISTS compte_collectif TEXT;         -- ex: '4411' pour fournisseurs, '3421' pour clients


-- ─── 4. Journal Config ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS journal_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    code TEXT NOT NULL CHECK (code IN ('HA','VT','BQ','CA','OD')),
    intitule TEXT NOT NULL,
    type_journal TEXT NOT NULL CHECK (type_journal IN ('achat','vente','tresorerie','od','situation')),
    compte_contrepartie TEXT,          -- ex: '5141' pour BQ
    mode_contrepartie TEXT DEFAULT 'ligne_a_ligne'
        CHECK (mode_contrepartie IN ('ligne_a_ligne', 'centralisation_fin_mois')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, code)
);

-- RLS for journal_config
ALTER TABLE journal_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own journal_config"
    ON journal_config FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own journal_config"
    ON journal_config FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own journal_config"
    ON journal_config FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own journal_config"
    ON journal_config FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_jconf_user ON journal_config(user_id);


-- ─── 5. Notify PostgREST ────────────────────────────────────
NOTIFY pgrst, 'reload schema';
