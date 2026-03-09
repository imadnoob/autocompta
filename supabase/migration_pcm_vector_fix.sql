-- Drop the old HNSW index first since it depends on the column type
drop index if exists pcm_accounts_embedding_idx;

-- Alter the column type from vector(768) to vector(3072)
alter table pcm_accounts alter column embedding type vector(3072);

-- Recreate the function to use vector(3072)
drop function if exists match_pcm_accounts;

create or replace function match_pcm_accounts (
  query_embedding vector(3072),
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
