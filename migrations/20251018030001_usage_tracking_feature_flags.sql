-- Migration: Usage tracking for SaaS billing
-- Date: 2025-10-18

-- Create usage_logs table for tracking resource consumption
create table if not exists usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_type text not null, -- 'rag_search', 'ai_query', 'storage', 'email_send'
  quantity int default 1,
  metadata jsonb, -- Store additional context (query, cost, duration, etc.)
  created_at timestamp default now() not null
);

-- Create indexes for efficient queries
create index if not exists idx_usage_logs_user_date on usage_logs(user_id, created_at desc);
create index if not exists idx_usage_logs_resource on usage_logs(resource_type, created_at desc);
create index if not exists idx_usage_logs_user_resource on usage_logs(user_id, resource_type, created_at desc);

-- Create feature_flags table for gradual feature rollout
create table if not exists feature_flags (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  enabled boolean default false,
  description text,
  created_at timestamp default now() not null,
  updated_at timestamp default now() not null
);

-- Create user_features for per-user feature overrides
create table if not exists user_features (
  user_id uuid references auth.users(id) on delete cascade,
  feature_id uuid references feature_flags(id) on delete cascade,
  enabled boolean default true,
  created_at timestamp default now() not null,
  primary key (user_id, feature_id)
);

-- Create function to get user's monthly usage
create or replace function get_monthly_usage(
  p_user_id uuid,
  p_resource_type text default null
)
returns table (
  resource_type text,
  total_quantity bigint,
  unique_days bigint
)
language sql stable
as $$
  select
    usage_logs.resource_type,
    sum(usage_logs.quantity) as total_quantity,
    count(distinct date(usage_logs.created_at)) as unique_days
  from usage_logs
  where
    usage_logs.user_id = p_user_id
    and usage_logs.created_at >= date_trunc('month', now())
    and (p_resource_type is null or usage_logs.resource_type = p_resource_type)
  group by usage_logs.resource_type;
$$;

-- Add comments
comment on table usage_logs is 'Tracks resource usage for billing and analytics';
comment on table feature_flags is 'Global feature flags for gradual rollout';
comment on table user_features is 'Per-user feature flag overrides';
comment on function get_monthly_usage is 'Get current month usage statistics for a user';

