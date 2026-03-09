-- SQL Migration: Add Plan Tiers and Pièce Comptable features

-- 1. Create the 'tiers' table
CREATE TABLE IF NOT EXISTS tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(20) CHECK (type IN ('fournisseur', 'client', 'salarie', 'autre')),
    name VARCHAR(255) NOT NULL,
    account_code_aux VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add updated_at trigger for tiers
CREATE OR REPLACE FUNCTION update_tiers_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tiers_modtime
BEFORE UPDATE ON tiers
FOR EACH ROW
EXECUTE FUNCTION update_tiers_updated_at_column();

-- Enable RLS for tiers
ALTER TABLE tiers ENABLE ROW LEVEL SECURITY;

-- Create policies for tiers
CREATE POLICY "Users can view their own tiers" ON tiers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tiers" ON tiers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tiers" ON tiers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tiers" ON tiers
    FOR DELETE USING (auth.uid() = user_id);

-- 2. Add 'piece_num' to 'journal_entries'
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS piece_num VARCHAR(50);

-- Notify PostgREST to reload the schema
NOTIFY pgrst, 'reload schema';
