-- ============================================================
-- SECURITY HOTFIX: Row Level Security (RLS) Lockdown
-- This script ensures ALL public tables are protected by RLS.
-- Run this in your Supabase SQL Editor (https://app.supabase.com)
-- ============================================================

-- ─── 1. ENABLE RLS ON ALL CORE TABLES ────────────────────────
ALTER TABLE IF EXISTS documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS exercice_comptable ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS journal_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pcm_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS accounting_fiscal_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS accounting_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS accounting_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS accounting_move_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS accounting_knowledge_base ENABLE ROW LEVEL SECURITY;

-- ─── 2. RE-APPLY OWNER POLICIES (Safety Net) ──────────────────
-- These policies ensure a user can only interact with their own data using 'user_id'

-- Documents
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
CREATE POLICY "Users can view their own documents" ON documents FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own documents" ON documents;
CREATE POLICY "Users can manage their own documents" ON documents FOR ALL USING (auth.uid() = user_id);

-- Journal Entries
DROP POLICY IF EXISTS "Users can view their own entries" ON journal_entries;
CREATE POLICY "Users can view their own entries" ON journal_entries FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own entries" ON journal_entries;
CREATE POLICY "Users can manage their own entries" ON journal_entries FOR ALL USING (auth.uid() = user_id);

-- Tiers
DROP POLICY IF EXISTS "Users can view their own tiers" ON tiers;
CREATE POLICY "Users can view their own tiers" ON tiers FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own tiers" ON tiers;
CREATE POLICY "Users can manage their own tiers" ON tiers FOR ALL USING (auth.uid() = user_id);

-- Exercice Comptable
DROP POLICY IF EXISTS "Users can view their own exercices" ON exercice_comptable;
CREATE POLICY "Users can view their own exercices" ON exercice_comptable FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own exercices" ON exercice_comptable;
CREATE POLICY "Users can manage their own exercices" ON exercice_comptable FOR ALL USING (auth.uid() = user_id);

-- Journal Config
DROP POLICY IF EXISTS "Users can view their own journal_config" ON journal_config;
CREATE POLICY "Users can view their own journal_config" ON journal_config FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own journal_config" ON journal_config;
CREATE POLICY "Users can manage their own journal_config" ON journal_config FOR ALL USING (auth.uid() = user_id);

-- ─── 3. SPECIAL CASE: PCM_ACCOUNTS (Global Reference) ────────
-- This table should be readable by all authenticated users but writable by no one.
DROP POLICY IF EXISTS "Allow read access to all authenticated users" ON pcm_accounts;
CREATE POLICY "Allow read access to all authenticated users" ON pcm_accounts FOR SELECT TO authenticated USING (true);

-- ─── 4. ROBUST SCHEMA TABLES (Accounting Moves) ──────────────
DROP POLICY IF EXISTS "Users control their fiscal years" ON accounting_fiscal_years;
CREATE POLICY "Users control their fiscal years" ON accounting_fiscal_years FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users control their journals" ON accounting_journals;
CREATE POLICY "Users control their journals" ON accounting_journals FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users control their moves" ON accounting_moves;
CREATE POLICY "Users control their moves" ON accounting_moves FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users control their move lines" ON accounting_move_lines;
CREATE POLICY "Users control their move lines" ON accounting_move_lines FOR ALL 
USING (EXISTS (SELECT 1 FROM accounting_moves m WHERE m.id = move_id AND m.user_id = auth.uid()));

-- ─── 5. RELOAD ──────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
