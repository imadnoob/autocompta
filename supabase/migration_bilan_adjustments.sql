-- ============================================================
-- Table bilan_adjustments — Ajustements manuels du Bilan
-- Stocke les valeurs structurelles (capital, réserves, immos...)
-- séparément des écritures comptables du journal.
-- ============================================================

CREATE TABLE IF NOT EXISTS bilan_adjustments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  year integer NOT NULL,
  account text NOT NULL,
  account_name text NOT NULL,
  label text,
  amount numeric(15,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ba_user ON bilan_adjustments(user_id);
CREATE INDEX IF NOT EXISTS idx_ba_year ON bilan_adjustments(year);

ALTER TABLE bilan_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own adjustments"
  ON bilan_adjustments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own adjustments"
  ON bilan_adjustments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own adjustments"
  ON bilan_adjustments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own adjustments"
  ON bilan_adjustments FOR DELETE
  USING (auth.uid() = user_id);
