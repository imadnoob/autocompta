-- Create vector extension
create extension if not exists vector;

-- Create table for PCM accounts
create table if not exists pcm_accounts (
  id uuid primary key default gen_random_uuid(),
  code varchar(20) not null unique,
  name text not null,
  description text,
  embedding vector(768) -- Gemini embeddings use 768 dimensions
);

-- Create an index for faster similarity searches (HNSW)
create index if not exists pcm_accounts_embedding_idx on pcm_accounts using hnsw (embedding vector_cosine_ops);

-- Create a function to search for matching accounts
create or replace function match_pcm_accounts (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  code varchar(20),
  name text,
  description text,
  similarity float
)
language sql stable
as $$
  select
    pcm_accounts.id,
    pcm_accounts.code,
    pcm_accounts.name,
    pcm_accounts.description,
    1 - (pcm_accounts.embedding <=> query_embedding) as similarity
  from pcm_accounts
  where 1 - (pcm_accounts.embedding <=> query_embedding) > match_threshold
  order by pcm_accounts.embedding <=> query_embedding
  limit match_count;
$$;
