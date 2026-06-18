alter table app_settings
  add column if not exists active_calendar_provider text not null default 'apple';

alter table app_settings
  drop constraint if exists app_settings_active_calendar_provider_check;

alter table app_settings
  add constraint app_settings_active_calendar_provider_check
  check (active_calendar_provider in ('apple', 'google', 'microsoft'));

update app_settings
set active_calendar_provider = 'apple'
where active_calendar_provider is null;
