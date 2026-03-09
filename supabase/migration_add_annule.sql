ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_accounting_status_check;
ALTER TABLE documents ADD CONSTRAINT documents_accounting_status_check 
  CHECK (accounting_status IN ('a_saisir', 'saisi', 'regle', 'lettre', 'valide', 'annule'));

NOTIFY pgrst, 'reload schema';
