create table if not exists booking_profiles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  headline text not null,
  subheadline text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  linkedin_url text,
  website_url text,
  secondary_website_url text,
  portrait_url text,
  primary_color text not null default '#527DF6',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table booking_profiles enable row level security;

create policy "Public can read active booking profiles"
  on booking_profiles for select
  using (is_active = true);

create policy "Admins can manage booking profiles"
  on booking_profiles for all
  using (exists (select 1 from admin_users where admin_users.user_id = auth.uid()))
  with check (exists (select 1 from admin_users where admin_users.user_id = auth.uid()));

insert into booking_profiles (
  slug,
  name,
  headline,
  subheadline,
  contact_name,
  contact_email,
  contact_phone,
  linkedin_url,
  website_url,
  secondary_website_url,
  portrait_url
)
values (
  'builtsmart-ai',
  'BuiltSmart AI',
  'Termin mit BuiltSmart AI buchen',
  'Wählen Sie einen passenden 30-Minuten-Termin für ein Erstgespräch, eine KI-Demo oder eine projektbezogene Beratung.',
  'Bernhard Metzger',
  'info@built-smart-hub.com',
  '+491627111911',
  'https://www.linkedin.com/in/bernhard-metzger-8376539a',
  'https://www.builtsmart-ai.app',
  'https://www.built-smart-hub.com',
  '/bernhard-metzger.jpg'
)
on conflict (slug) do update set
  name = excluded.name,
  headline = excluded.headline,
  subheadline = excluded.subheadline,
  contact_name = excluded.contact_name,
  contact_email = excluded.contact_email,
  contact_phone = excluded.contact_phone,
  linkedin_url = excluded.linkedin_url,
  website_url = excluded.website_url,
  secondary_website_url = excluded.secondary_website_url,
  portrait_url = excluded.portrait_url,
  updated_at = now();

alter table booking_types
  add column if not exists profile_id uuid references booking_profiles(id) on delete set null;

update booking_types
set profile_id = (select id from booking_profiles where slug = 'builtsmart-ai')
where profile_id is null;

create index if not exists booking_types_profile_id_idx on booking_types(profile_id);
