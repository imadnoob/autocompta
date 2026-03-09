-- ============================================================
-- Phase 8: Table journal_entries — Persistance des écritures
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add 'regle' to the accounting_status check (if not already done)
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_accounting_status_check;
ALTER TABLE documents ADD CONSTRAINT documents_accounting_status_check
  CHECK (accounting_status IN ('a_saisir', 'saisi', 'regle', 'lettre', 'valide'));

-- 2. Create journal_entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  doc_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  journal text NOT NULL CHECK (journal IN ('HA','VT','BQ','CA','OD')),
  entry_date date NOT NULL,
  account text NOT NULL,
  account_name text NOT NULL,
  label text NOT NULL,
  debit numeric(15,2) DEFAULT 0,
  credit numeric(15,2) DEFAULT 0,
  ref text,
  supplier text,
  lettre_code text,
  is_contrepassation boolean DEFAULT false,
  piece_num text,  -- numérotation par journal: HA-001, BQ-002…
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_je_user    ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_je_journal ON journal_entries(journal);
CREATE INDEX IF NOT EXISTS idx_je_account ON journal_entries(account);
CREATE INDEX IF NOT EXISTS idx_je_doc     ON journal_entries(doc_id);
CREATE INDEX IF NOT EXISTS idx_je_lettre  ON journal_entries(lettre_code);
CREATE INDEX IF NOT EXISTS idx_je_date    ON journal_entries(entry_date);

-- 4. RLS policies
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own entries"
  ON journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own entries"
  ON journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries"
  ON journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries"
  ON journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Sequence for piece numbering per journal
CREATE SEQUENCE IF NOT EXISTS seq_piece_ha START 1;
CREATE SEQUENCE IF NOT EXISTS seq_piece_vt START 1;
CREATE SEQUENCE IF NOT EXISTS seq_piece_bq START 1;
CREATE SEQUENCE IF NOT EXISTS seq_piece_ca START 1;
CREATE SEQUENCE IF NOT EXISTS seq_piece_od START 1;

-- Helper function: get next piece number for a journal
CREATE OR REPLACE FUNCTION next_piece_num(p_journal text)
RETURNS text AS $$
DECLARE
  v_num bigint;
BEGIN
  EXECUTE format('SELECT nextval(''seq_piece_%s'')', lower(p_journal)) INTO v_num;
  RETURN p_journal || '-' || lpad(v_num::text, 4, '0');
END;
$$ LANGUAGE plpgsql;
