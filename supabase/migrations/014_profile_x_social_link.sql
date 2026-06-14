alter table booking_profiles
  add column if not exists x_url text,
  add column if not exists show_x boolean not null default true;
