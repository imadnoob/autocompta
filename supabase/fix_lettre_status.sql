UPDATE documents 
SET accounting_status = 'lettre' 
WHERE id IN (
    SELECT doc_id 
    FROM journal_entries 
    WHERE lettre_code IS NOT NULL 
    AND doc_id IS NOT NULL
);
