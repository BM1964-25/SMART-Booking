alter table booking_profiles
  add column if not exists profile_layout text not null default 'split';

update booking_profiles
set profile_layout = 'split'
where profile_layout is null or profile_layout = '';
