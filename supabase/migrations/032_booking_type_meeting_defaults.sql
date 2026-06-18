alter table booking_types
  add column if not exists default_meeting_location text not null default 'phone';

alter table booking_types
  drop constraint if exists booking_types_default_meeting_location_check;

alter table booking_types
  add constraint booking_types_default_meeting_location_check
  check (default_meeting_location in ('phone', 'zoom', 'teams', 'google_meet', 'onsite', 'individual'));
