-- ============================================================
-- TIERS ACCOUNT PROPAGATION FIX
-- Synchronizes journal entries when a tier account code changes
-- ============================================================

-- 1. Function to propagate account code changes
CREATE OR REPLACE FUNCTION propagate_tier_account_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Protection: On ne fait rien si le code n'a pas changé
    IF OLD.account_code_aux IS DISTINCT FROM NEW.account_code_aux THEN
        
        -- 1. Mise à jour de la table journal_entries
        UPDATE journal_entries
        SET account = NEW.account_code_aux
        WHERE account = OLD.account_code_aux
        AND user_id = NEW.user_id;

        -- 2. Mise à jour de la table accounting_move_lines (nouvelle architecture)
        -- On lie via partner_id si possible, sinon via le code compte
        UPDATE accounting_move_lines
        SET account = NEW.account_code_aux
        WHERE (partner_id = NEW.id OR account = OLD.account_code_aux)
        AND move_id IN (
            SELECT id FROM accounting_moves WHERE user_id = NEW.user_id
        );

        -- 3. Mise à jour du libellé si le nom de l'entreprise a aussi changé
        IF OLD.name IS DISTINCT FROM NEW.name THEN
            UPDATE journal_entries
            SET label = REPLACE(label, OLD.name, NEW.name)
            WHERE label LIKE '%' || OLD.name || '%'
            AND user_id = NEW.user_id;
        END IF;

    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- IMPORTANT: SECURITY DEFINER pour bypasser RLS lors du trigger

-- 2. Create the trigger on tiers table
DROP TRIGGER IF EXISTS trg_propagate_tier_account ON tiers;
CREATE TRIGGER trg_propagate_tier_account
    AFTER UPDATE ON tiers
    FOR EACH ROW
    EXECUTE FUNCTION propagate_tier_account_change();

-- 3. Cleanup: Notify PostgREST
NOTIFY pgrst, 'reload schema';
