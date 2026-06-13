alter table bookings
  add column if not exists meeting_location text not null default 'phone'
  check (meeting_location in ('phone', 'zoom', 'teams', 'google_meet', 'onsite', 'individual'));
