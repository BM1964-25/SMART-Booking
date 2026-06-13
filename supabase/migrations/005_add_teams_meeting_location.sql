alter table bookings
  drop constraint if exists bookings_meeting_location_check;

alter table bookings
  add constraint bookings_meeting_location_check
  check (meeting_location in ('phone', 'zoom', 'teams', 'google_meet', 'onsite', 'individual'));
