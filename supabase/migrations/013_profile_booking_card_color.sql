alter table booking_profiles
  add column if not exists booking_card_bg_color text not null default '#FFFFFF';
