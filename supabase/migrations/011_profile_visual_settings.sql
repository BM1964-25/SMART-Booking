alter table booking_profiles
  add column if not exists profile_card_bg_color text not null default '#F8FAFC',
  add column if not exists portrait_position_x integer not null default 50,
  add column if not exists portrait_position_y integer not null default 35,
  add column if not exists portrait_zoom numeric not null default 1;
