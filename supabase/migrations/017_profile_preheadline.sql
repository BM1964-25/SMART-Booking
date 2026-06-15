alter table booking_profiles
  add column if not exists preheadline text default 'SMART Booking',
  add column if not exists show_preheadline boolean not null default true;

update booking_profiles
set preheadline = coalesce(nullif(preheadline, ''), 'SMART Booking')
where preheadline is null or preheadline = '';
