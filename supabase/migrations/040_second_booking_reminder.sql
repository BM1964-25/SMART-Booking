alter table booking_types
  add column if not exists reminder_2_enabled boolean not null default false,
  add column if not exists reminder_2_minutes_before integer not null default 120;

alter table booking_types
  alter column reminder_2_minutes_before set default 120;

alter table booking_types
  drop constraint if exists booking_types_reminder_2_minutes_before_check;

alter table booking_types
  add constraint booking_types_reminder_2_minutes_before_check
  check (reminder_2_minutes_before between 15 and 10080);

alter table bookings
  add column if not exists reminder_2_sent_at timestamptz,
  add column if not exists reminder_2_attempted_at timestamptz,
  add column if not exists reminder_2_last_error text;

create index if not exists bookings_second_reminder_due_idx
  on bookings (status, reminder_2_sent_at, starts_at);
