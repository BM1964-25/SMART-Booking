alter table booking_profiles
  add column if not exists spotify_url text,
  add column if not exists show_spotify boolean not null default true;
