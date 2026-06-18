create table if not exists oauth_states (
  state text primary key,
  provider text not null check (provider in ('google', 'microsoft')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

alter table oauth_states enable row level security;

create policy "Admins can manage oauth states"
  on oauth_states for all
  using (exists (select 1 from admin_users where admin_users.user_id = auth.uid()))
  with check (exists (select 1 from admin_users where admin_users.user_id = auth.uid()));

delete from oauth_states
where expires_at < now();
