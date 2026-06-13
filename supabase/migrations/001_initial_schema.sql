create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create table if not exists booking_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  duration_minutes integer not null check (duration_minutes > 0),
  buffer_before_minutes integer not null default 0,
  buffer_after_minutes integer not null default 0,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists availability_rules (
  id uuid primary key default gen_random_uuid(),
  weekday integer not null check (weekday between 1 and 7),
  start_time time not null,
  end_time time not null,
  timezone text not null default 'Europe/Berlin',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (start_time < end_time)
);

create table if not exists calendar_connections (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'apple',
  calendar_id text,
  display_name text,
  is_active boolean not null default true,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  booking_type_id uuid not null references booking_types(id),
  customer_name text not null,
  customer_email text not null,
  company text not null,
  phone text,
  meeting_location text not null default 'phone' check (meeting_location in ('phone', 'zoom', 'teams', 'google_meet', 'onsite', 'individual')),
  meeting_url text,
  topic text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'Europe/Berlin',
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  cancellation_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  calendar_event_id text,
  calendar_event_url text,
  privacy_accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at < ends_at)
);

create table if not exists blocked_times (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  check (starts_at < ends_at)
);

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'admin' check (role in ('owner', 'admin')),
  created_at timestamptz not null default now()
);

create index if not exists bookings_starts_at_idx on bookings(starts_at);
create index if not exists bookings_status_idx on bookings(status);
create index if not exists blocked_times_range_idx on blocked_times(starts_at, ends_at);
create index if not exists availability_rules_weekday_idx on availability_rules(weekday);

alter table bookings
  add constraint bookings_no_confirmed_overlap
  exclude using gist (tstzrange(starts_at, ends_at, '[)') with &&)
  where (status = 'confirmed');

alter table booking_types enable row level security;
alter table availability_rules enable row level security;
alter table calendar_connections enable row level security;
alter table bookings enable row level security;
alter table blocked_times enable row level security;
alter table admin_users enable row level security;

create policy "Public can read active booking types"
  on booking_types for select
  using (is_active = true);

create policy "Public can read active availability rules"
  on availability_rules for select
  using (is_active = true);

create policy "Admins can read admin users"
  on admin_users for select
  using (auth.uid() = user_id);

create policy "Admins can manage booking types"
  on booking_types for all
  using (exists (select 1 from admin_users where admin_users.user_id = auth.uid()))
  with check (exists (select 1 from admin_users where admin_users.user_id = auth.uid()));

create policy "Admins can manage availability"
  on availability_rules for all
  using (exists (select 1 from admin_users where admin_users.user_id = auth.uid()))
  with check (exists (select 1 from admin_users where admin_users.user_id = auth.uid()));

create policy "Admins can read bookings"
  on bookings for select
  using (exists (select 1 from admin_users where admin_users.user_id = auth.uid()));

create policy "Admins can update bookings"
  on bookings for update
  using (exists (select 1 from admin_users where admin_users.user_id = auth.uid()))
  with check (exists (select 1 from admin_users where admin_users.user_id = auth.uid()));

create policy "Admins can manage blocked times"
  on blocked_times for all
  using (exists (select 1 from admin_users where admin_users.user_id = auth.uid()))
  with check (exists (select 1 from admin_users where admin_users.user_id = auth.uid()));

create policy "Admins can manage calendar connections"
  on calendar_connections for all
  using (exists (select 1 from admin_users where admin_users.user_id = auth.uid()))
  with check (exists (select 1 from admin_users where admin_users.user_id = auth.uid()));

insert into booking_types (slug, name, description, duration_minutes, buffer_before_minutes, buffer_after_minutes, sort_order)
values
  ('erstgespraech', 'Kostenloses Erstgespräch', 'Kurzes Kennenlernen und Einordnung Ihres Vorhabens.', 30, 5, 10, 1),
  ('ki-demo-builtsmart-ai', 'KI-Demo BuiltSmart AI', 'Live-Demo der wichtigsten Funktionen und Einsatzszenarien.', 30, 10, 10, 2),
  ('projektanalyse', 'Projektanalyse', 'Strukturierte Analyse Ihres Projekts und nächste Schritte.', 30, 10, 15, 3),
  ('beratung-bau-immobilien', 'Beratung Bau und Immobilien', 'Fachliche Beratung für Bau- und Immobilienprozesse.', 30, 10, 15, 4)
on conflict (slug) do nothing;

insert into availability_rules (weekday, start_time, end_time)
values
  (1, '09:00', '17:00'),
  (2, '09:00', '17:00'),
  (3, '09:00', '17:00'),
  (4, '09:00', '17:00'),
  (5, '09:00', '15:00')
on conflict do nothing;
