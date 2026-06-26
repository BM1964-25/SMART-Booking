alter table app_settings
  add column if not exists booking_window_days integer not null default 28;

alter table app_settings
  drop constraint if exists app_settings_booking_window_days_check;

alter table app_settings
  add constraint app_settings_booking_window_days_check
  check (booking_window_days in (14, 28, 42, 56, 90, 180));

update app_settings
set booking_window_days = 28
where booking_window_days is null
   or booking_window_days not in (14, 28, 42, 56, 90, 180);
