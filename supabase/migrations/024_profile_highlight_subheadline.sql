alter table booking_profiles
  add column if not exists highlight_subheadline text,
  add column if not exists show_highlight_subheadline boolean not null default false;
