alter table booking_profiles
  add column if not exists allow_embed_view boolean not null default false;

update booking_profiles
set allow_embed_view = false
where allow_embed_view is null;
