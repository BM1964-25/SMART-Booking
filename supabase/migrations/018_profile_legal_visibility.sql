alter table booking_profiles
  add column if not exists show_legal_privacy boolean not null default true,
  add column if not exists show_legal_imprint boolean not null default true;
