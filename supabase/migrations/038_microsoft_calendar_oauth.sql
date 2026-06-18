alter table app_settings
  add column if not exists microsoft_client_id text,
  add column if not exists microsoft_client_secret text;
