-- ============================================================
-- TIERS ACCOUNT PROPAGATION FIX
-- Synchronizes journal entries when a tier account code changes
-- ============================================================

-- 1. Function to propagate account code changes
CREATE OR REPLACE FUNCTION propagate_tier_account_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger if the account code has actually changed
    IF OLD.account_code_aux != NEW.account_code_aux THEN
        
        -- Update the old journal_entries table
        UPDATE journal_entries
        SET account = NEW.account_code_aux
        WHERE account = OLD.account_code_aux
        AND user_id = NEW.user_id;

        -- Update the robust accounting_move_lines table
        UPDATE accounting_move_lines
        SET account = NEW.account_code_aux
        WHERE account = OLD.account_code_aux
        AND move_id IN (
            SELECT id FROM accounting_moves WHERE user_id = NEW.user_id
        );

        -- Optional: Log the change (can be seen in Supabase logs)
        RAISE NOTICE 'Propagated tier account change from % to % for user %', OLD.account_code_aux, NEW.account_code_aux, NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on tiers table
DROP TRIGGER IF EXISTS trg_propagate_tier_account ON tiers;
CREATE TRIGGER trg_propagate_tier_account
    AFTER UPDATE ON tiers
    FOR EACH ROW
    EXECUTE FUNCTION propagate_tier_account_change();

-- 3. Cleanup: Notify PostgREST
NOTIFY pgrst, 'reload schema';
