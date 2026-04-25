-- ============================================================
-- Migration: Remove character limits for company/supplier names
-- This script converts VARCHAR columns to TEXT to allow infinite length.
-- ============================================================

-- 1. Tiers Table
ALTER TABLE IF EXISTS tiers ALTER COLUMN name TYPE TEXT;
ALTER TABLE IF EXISTS tiers ALTER COLUMN account_code_aux TYPE TEXT;

-- 2. Journal Config
ALTER TABLE IF EXISTS journal_config ALTER COLUMN intitule TYPE TEXT;

-- 3. PCM Accounts (Just in case)
ALTER TABLE IF EXISTS pcm_accounts ALTER COLUMN name TYPE TEXT;

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
