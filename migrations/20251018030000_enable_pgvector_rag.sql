-- Migration: Enable pgvector for RAG (Retrieval Augmented Generation)
-- Date: 2025-10-18

-- Enable pgvector extension
create extension if not exists vector;

-- Add embedding column to emails table
alter table emails add column if not exists embedding vector(1536);

-- Create index for fast similarity search using IVFFlat
-- Lists parameter optimized for performance (100 lists recommended for 10K-100K rows)
create index if not exists emails_embedding_idx on emails 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Create similarity search function for semantic email search
create or replace function match_emails(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_user_id uuid
)
returns table (
  id uuid,
  subject text,
  body_text text,
  from_address jsonb,
  received_at timestamp,
  similarity float
)
language sql stable
as $$
  select
    emails.id,
    emails.subject,
    emails.body_text,
    emails.from_address,
    emails.received_at,
    1 - (emails.embedding <=> query_embedding) as similarity
  from emails
  where 
    emails.user_id = filter_user_id
    and 1 - (emails.embedding <=> query_embedding) > match_threshold
  order by emails.embedding <=> query_embedding
  limit match_count;
$$;

-- Add comment for documentation
comment on function match_emails is 'Performs semantic similarity search on emails using vector embeddings. Returns emails most similar to the query embedding.';
comment on column emails.embedding is 'OpenAI text-embedding-3-small vector (1536 dimensions) for semantic search';

