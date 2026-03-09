-- ============================================================
-- Migration: Textbook Knowledge RAG Database
-- This script creates a table to store perfect accounting entries
-- sourced from textbooks to act as an infallible reference for the AI.
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable the pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── 1. KNOWLEDGE BASE TABLE ────────────────────────────────
CREATE TABLE IF NOT EXISTS accounting_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Null means global entry
    situation_description TEXT NOT NULL,       -- e.g., "Achat de matières premières à crédit"
    expected_journal TEXT NOT NULL,            -- e.g., "HA"
    expected_main_account TEXT NOT NULL,       -- e.g., "6121"
    expected_tier_account TEXT,                -- e.g., "4411"
    expected_tva_account TEXT,                 -- e.g., "34552" or null if no TVA
    embedding vector(768),                     -- Vector for similarity search (Gemini model size)
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Optimize vector search with an index
CREATE INDEX IF NOT EXISTS idx_accounting_knowledge_embedding 
ON accounting_knowledge_base USING hnsw (embedding vector_cosine_ops);

-- ─── 2. RAG MATCHING FUNCTION ───────────────────────────────
CREATE OR REPLACE FUNCTION match_textbook_accounting (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
RETURNS TABLE (
  id uuid,
  situation_description text,
  expected_journal text,
  expected_main_account text,
  expected_tier_account text,
  expected_tva_account text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    akb.id,
    akb.situation_description,
    akb.expected_journal,
    akb.expected_main_account,
    akb.expected_tier_account,
    akb.expected_tva_account,
    1 - (akb.embedding <=> query_embedding) AS similarity
  FROM accounting_knowledge_base akb
  WHERE 1 - (akb.embedding <=> query_embedding) > match_threshold
  AND (akb.user_id = p_user_id OR akb.user_id IS NULL)
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- ─── 3. ROW LEVEL SECURITY (RLS) ────────────────────────────
ALTER TABLE accounting_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own knowledge base
DROP POLICY IF EXISTS "Users control their own knowledge base" ON accounting_knowledge_base;
CREATE POLICY "Users control their own knowledge base and can read global" 
ON accounting_knowledge_base FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert/update their own knowledge base" 
ON accounting_knowledge_base FOR ALL 
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
