-- ============================================================
-- Migration: Atomic internal reference (dynamic, gap-filling)
-- ============================================================

-- 1. Add internal_ref column
ALTER TABLE documents ADD COLUMN IF NOT EXISTS internal_ref TEXT;

-- 2. Drop the old sequence (no longer needed)
DROP SEQUENCE IF EXISTS doc_ref_seq;

-- 3. Create a function that generates AC-YYYY-NNNN on insert
--    Uses MAX of existing refs for the current year instead of a sequence,
--    so if all documents are deleted, the counter restarts from 1.
CREATE OR REPLACE FUNCTION generate_internal_ref()
RETURNS TRIGGER AS $$
DECLARE
    current_year TEXT;
    max_num INT;
    next_num INT;
BEGIN
    current_year := EXTRACT(YEAR FROM NOW())::TEXT;

    -- Find the highest existing number for this year
    SELECT COALESCE(
        MAX(
            CAST(
                SUBSTRING(internal_ref FROM 'AC-' || current_year || '-(\d+)')
            AS INT)
        ),
        0
    ) INTO max_num
    FROM documents
    WHERE internal_ref LIKE 'AC-' || current_year || '-%';

    next_num := max_num + 1;
    NEW.internal_ref := 'AC-' || current_year || '-' || LPAD(next_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create a trigger that fires BEFORE INSERT
DROP TRIGGER IF EXISTS trg_generate_internal_ref ON documents;
CREATE TRIGGER trg_generate_internal_ref
    BEFORE INSERT ON documents
    FOR EACH ROW
    EXECUTE FUNCTION generate_internal_ref();

-- 5. Backfill existing documents that don't have a ref
-- (ordered by created_at so older docs get lower numbers)
DO $$
DECLARE
    doc RECORD;
    current_year TEXT;
    counter INT := 0;
BEGIN
    current_year := EXTRACT(YEAR FROM NOW())::TEXT;
    FOR doc IN
        SELECT id FROM documents
        WHERE internal_ref IS NULL
        ORDER BY created_at ASC
    LOOP
        counter := counter + 1;
        UPDATE documents
        SET internal_ref = 'AC-' || current_year || '-' || LPAD(counter::TEXT, 4, '0')
        WHERE id = doc.id;
    END LOOP;
END $$;
