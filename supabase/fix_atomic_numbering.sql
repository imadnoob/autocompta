-- ============================================================
-- ATOMIC INTERNAL REFERENCE FIX
-- Resolves duplicates and numbering skips during batch imports
-- Handles numbering per USER and per YEAR
-- ============================================================

-- 1. Create a dedicated counters table to ensure atomicity
CREATE TABLE IF NOT EXISTS document_counters (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    year INT NOT NULL,
    last_value INT DEFAULT 0,
    PRIMARY KEY (user_id, year)
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_doc_counters_lookup ON document_counters(user_id, year);

-- 2. New atomic function for generating the reference
CREATE OR REPLACE FUNCTION generate_internal_ref()
RETURNS TRIGGER AS $$
DECLARE
    current_year_int INT;
    current_year_str TEXT;
    next_num INT;
BEGIN
    -- Only generate if it doesn't exist
    IF NEW.internal_ref IS NOT NULL THEN
        RETURN NEW;
    END IF;

    current_year_int := EXTRACT(YEAR FROM NOW())::INT;
    current_year_str := current_year_int::TEXT;

    -- ATOMIC OPERATION: Update or Insert the counter for THIS user and THIS year
    -- The 'RETURNING' clause ensures we get the new value in a single thread-safe step
    INSERT INTO document_counters (user_id, year, last_value)
    VALUES (NEW.user_id, current_year_int, 1)
    ON CONFLICT (user_id, year)
    DO UPDATE SET last_value = document_counters.last_value + 1
    RETURNING last_value INTO next_num;

    -- Format: AC-YYYY-NNNN
    NEW.internal_ref := 'AC-' || current_year_str || '-' || LPAD(next_num::TEXT, 4, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER ensures it can update document_counters

-- 3. Security: Enable RLS on the new counters table
ALTER TABLE document_counters ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own counters
DROP POLICY IF EXISTS "Users control their own counters" ON document_counters;
CREATE POLICY "Users control their own counters" ON document_counters 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Re-link the trigger
DROP TRIGGER IF EXISTS trg_generate_internal_ref ON documents;
CREATE TRIGGER trg_generate_internal_ref
    BEFORE INSERT ON documents
    FOR EACH ROW
    EXECUTE FUNCTION generate_internal_ref();

-- 4. Initial Synchronization (Optional but recommended)
-- This logic populates the counters table with the current MAX from documents table
-- to avoid restarting at 0 if the table already has data.
INSERT INTO document_counters (user_id, year, last_value)
SELECT 
    user_id, 
    EXTRACT(YEAR FROM created_at)::INT as year, 
    MAX(CAST(SUBSTRING(internal_ref FROM '-(\d+)$') AS INT)) as last_val
FROM documents
WHERE internal_ref LIKE 'AC-%'
GROUP BY user_id, year
ON CONFLICT (user_id, year) 
DO UPDATE SET last_value = EXCLUDED.last_value;

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
