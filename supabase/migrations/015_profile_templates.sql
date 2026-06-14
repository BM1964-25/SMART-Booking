create table if not exists booking_profile_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  template_data jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table booking_profile_templates enable row level security;

create policy "Admins can manage booking profile templates"
  on booking_profile_templates for all
  using (exists (select 1 from admin_users where admin_users.user_id = auth.uid()))
  with check (exists (select 1 from admin_users where admin_users.user_id = auth.uid()));
