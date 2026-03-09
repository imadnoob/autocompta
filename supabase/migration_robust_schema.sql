-- ============================================================
-- Migration: Robust Accounting Schema (Sage 100 & N8N Inspired)
-- This script creates the core architecture for a bulletproof accounting system.
-- Run this in Supabase SQL Editor
-- ============================================================

-- ─── 0. ENUMS ───────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE move_status AS ENUM ('draft', 'posted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ─── 1. FISCAL YEARS (Exercices Compatibles) ────────────────
CREATE TABLE IF NOT EXISTS accounting_fiscal_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    label TEXT NOT NULL,             -- e.g. "Exercice 2026"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_afy_user ON accounting_fiscal_years(user_id);

-- ─── 2. JOURNALS (Journaux Compatibles) ─────────────────────
CREATE TABLE IF NOT EXISTS accounting_journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    code TEXT NOT NULL,              -- e.g. "HA", "VT", "BQ"
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('achat', 'vente', 'tresorerie', 'od', 'situation')),
    default_account TEXT,            -- e.g. "5141" for Banque
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, code)
);
CREATE INDEX IF NOT EXISTS idx_aj_user ON accounting_journals(user_id);

-- ─── 3. ACCOUNTING MOVES (Pièces Comptables / En-têtes) ─────
CREATE TABLE IF NOT EXISTS accounting_moves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    fiscal_year_id UUID REFERENCES accounting_fiscal_years(id) ON DELETE RESTRICT,
    journal_id UUID REFERENCES accounting_journals(id) ON DELETE RESTRICT NOT NULL,
    date DATE NOT NULL,
    piece_number TEXT,               -- e.g. "HA-2026-0001" (Generated on post)
    description TEXT,                -- Libellé général de la pièce
    status move_status DEFAULT 'draft' NOT NULL,
    source_type TEXT,                -- e.g. 'n8n_webhook', 'manual', 'invoice_ai'
    source_id TEXT,                  -- External reference ID
    created_at TIMESTAMPTZ DEFAULT now(),
    posted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_am_user ON accounting_moves(user_id);
CREATE INDEX IF NOT EXISTS idx_am_date ON accounting_moves(date);
CREATE INDEX IF NOT EXISTS idx_am_journal ON accounting_moves(journal_id);

-- ─── 4. ACCOUNTING MOVE LINES (Lignes d'Écritures) ──────────
CREATE TABLE IF NOT EXISTS accounting_move_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    move_id UUID REFERENCES accounting_moves(id) ON DELETE CASCADE NOT NULL,
    account TEXT NOT NULL,           -- PCM Code e.g. "6111"
    account_name TEXT,               -- PCM Name
    partner_id UUID REFERENCES tiers(id) ON DELETE SET NULL, -- Tiers/Supplier/Customer
    label TEXT NOT NULL,             -- Libellé de la ligne
    debit NUMERIC(15,2) DEFAULT 0 CHECK (debit >= 0),
    credit NUMERIC(15,2) DEFAULT 0 CHECK (credit >= 0),
    matching_number TEXT,            -- Lettre de lettrage e.g. "A", "AA"
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_aml_move ON accounting_move_lines(move_id);
CREATE INDEX IF NOT EXISTS idx_aml_account ON accounting_move_lines(account);
CREATE INDEX IF NOT EXISTS idx_aml_partner ON accounting_move_lines(partner_id);

-- ─── 5. SECURITY RULES & TRIGGERS ───────────────────────────

-- TRIGGER A: Enforce Double Entry Validation (Débit = Crédit) when posting
CREATE OR REPLACE FUNCTION check_double_entry_balance()
RETURNS TRIGGER AS $$
DECLARE
    total_debit NUMERIC;
    total_credit NUMERIC;
BEGIN
    IF NEW.status = 'posted' AND (OLD.status = 'draft' OR OLD.status IS NULL) THEN
        SELECT COALESCE(SUM(debit), 0), COALESCE(SUM(credit), 0)
        INTO total_debit, total_credit
        FROM accounting_move_lines
        WHERE move_id = NEW.id;

        IF total_debit != total_credit THEN
            RAISE EXCEPTION 'Unbalanced Journal Entry: Total Debit (%) does not equal Total Credit (%). Cannot post piece %.', total_debit, total_credit, NEW.id;
        END IF;
        
        -- Also check if total is 0 (empty move)
        IF total_debit = 0 THEN
             RAISE EXCEPTION 'Empty Journal Entry: Cannot post piece % with 0 amounts.', NEW.id;
        END IF;
        
        -- Set posted_at
        NEW.posted_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_balance ON accounting_moves;
CREATE TRIGGER trg_check_balance
    BEFORE UPDATE ON accounting_moves
    FOR EACH ROW
    WHEN (NEW.status = 'posted')
    EXECUTE FUNCTION check_double_entry_balance();

-- TRIGGER B: Enforce Irreversibility (Cannot Modify/Delete Posted Moves)
CREATE OR REPLACE FUNCTION protect_posted_moves()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'posted' THEN
        RAISE EXCEPTION 'Irreversibility Rule: Cannot alter or delete a posted accounting move.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_moves_update ON accounting_moves;
CREATE TRIGGER trg_protect_moves_update
    BEFORE UPDATE ON accounting_moves
    FOR EACH ROW
    EXECUTE FUNCTION protect_posted_moves();

DROP TRIGGER IF EXISTS trg_protect_moves_delete ON accounting_moves;
CREATE TRIGGER trg_protect_moves_delete
    BEFORE DELETE ON accounting_moves
    FOR EACH ROW
    EXECUTE FUNCTION protect_posted_moves();

-- TRIGGER C: Protect Move Lines of Posted Moves
CREATE OR REPLACE FUNCTION protect_posted_move_lines()
RETURNS TRIGGER AS $$
DECLARE
    move_state move_status;
BEGIN
    -- Check if the parent move is posted
    SELECT status INTO move_state FROM accounting_moves WHERE id = COALESCE(NEW.move_id, OLD.move_id);
    IF move_state = 'posted' THEN
        -- Allow updates only for matching_number (lettrage) on posted moves
        IF TG_OP = 'UPDATE' THEN
            IF NEW.debit != OLD.debit OR NEW.credit != OLD.credit OR NEW.account != OLD.account OR NEW.move_id != OLD.move_id THEN
                RAISE EXCEPTION 'Irreversibility Rule: Cannot alter financial data of a posted move line.';
            END IF;
        ELSE
            RAISE EXCEPTION 'Irreversibility Rule: Cannot insert or delete lines in a posted accounting move.';
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_lines ON accounting_move_lines;
CREATE TRIGGER trg_protect_lines
    BEFORE INSERT OR UPDATE OR DELETE ON accounting_move_lines
    FOR EACH ROW
    EXECUTE FUNCTION protect_posted_move_lines();

-- ─── 6. ROW LEVEL SECURITY (RLS) ────────────────────────────

ALTER TABLE accounting_fiscal_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users control their fiscal years" ON accounting_fiscal_years FOR ALL USING (auth.uid() = user_id);

ALTER TABLE accounting_journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users control their journals" ON accounting_journals FOR ALL USING (auth.uid() = user_id);

ALTER TABLE accounting_moves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users control their moves" ON accounting_moves FOR ALL USING (auth.uid() = user_id);

-- For move lines, users can access lines where the parent move belongs to them
ALTER TABLE accounting_move_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users control their move lines" ON accounting_move_lines FOR ALL 
USING (EXISTS (SELECT 1 FROM accounting_moves m WHERE m.id = move_id AND m.user_id = auth.uid()));

NOTIFY pgrst, 'reload schema';
