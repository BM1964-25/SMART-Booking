alter table booking_profiles
  add column if not exists xing_url text,
  add column if not exists instagram_url text,
  add column if not exists facebook_url text,
  add column if not exists youtube_url text;
