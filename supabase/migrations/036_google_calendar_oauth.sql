alter table app_settings
  add column if not exists google_client_id text,
  add column if not exists google_client_secret text;

create table if not exists calendar_oauth_connections (
  id uuid primary key default gen_random_uuid(),
  provider text not null unique check (provider in ('google', 'microsoft')),
  account_email text,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  scope text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table calendar_oauth_connections enable row level security;

create policy "Admins can manage calendar oauth connections"
  on calendar_oauth_connections for all
  using (exists (select 1 from admin_users where admin_users.user_id = auth.uid()))
  with check (exists (select 1 from admin_users where admin_users.user_id = auth.uid()));
