alter table booking_types
  add column if not exists reminder_enabled boolean not null default false,
  add column if not exists reminder_minutes_before integer not null default 120,
  add column if not exists reminder_note text;

alter table booking_types
  alter column reminder_minutes_before set default 120;

update booking_types
set reminder_minutes_before = 120
where reminder_enabled = false
  and reminder_minutes_before = 1440;

alter table booking_types
  drop constraint if exists booking_types_reminder_minutes_before_check;

alter table booking_types
  add constraint booking_types_reminder_minutes_before_check
  check (reminder_minutes_before between 15 and 10080);

alter table bookings
  add column if not exists reminder_sent_at timestamptz,
  add column if not exists reminder_attempted_at timestamptz,
  add column if not exists reminder_last_error text;

create index if not exists bookings_reminder_due_idx
  on bookings (status, reminder_sent_at, starts_at);
