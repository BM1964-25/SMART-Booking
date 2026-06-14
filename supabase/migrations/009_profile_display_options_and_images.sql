alter table booking_profiles
  add column if not exists show_portrait boolean not null default true,
  add column if not exists show_subheadline boolean not null default true,
  add column if not exists show_contact_links boolean not null default true;

insert into storage.buckets (id, name, public)
values ('booking-profile-images', 'booking-profile-images', true)
on conflict (id) do update set public = excluded.public;
