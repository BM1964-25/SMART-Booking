alter table booking_profiles
  add column if not exists show_contact_name boolean not null default true,
  add column if not exists show_contact_email boolean not null default true,
  add column if not exists show_contact_phone boolean not null default true,
  add column if not exists show_linkedin boolean not null default true,
  add column if not exists show_xing boolean not null default true,
  add column if not exists show_instagram boolean not null default true,
  add column if not exists show_facebook boolean not null default true,
  add column if not exists show_youtube boolean not null default true,
  add column if not exists show_website boolean not null default true;
