alter table booking_profiles
  add column if not exists portrait_display_name text,
  add column if not exists show_portrait_display_name boolean not null default true,
  add column if not exists portrait_info text,
  add column if not exists show_portrait_info boolean not null default false;
