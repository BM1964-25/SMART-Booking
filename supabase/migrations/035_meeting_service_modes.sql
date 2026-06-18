alter table app_settings
  add column if not exists zoom_meeting_mode text not null default 'fixed_link',
  add column if not exists google_meeting_mode text not null default 'fixed_link',
  add column if not exists teams_meeting_mode text not null default 'fixed_link',
  add column if not exists zoom_account_id text,
  add column if not exists zoom_client_id text,
  add column if not exists zoom_client_secret text;

alter table app_settings
  drop constraint if exists app_settings_zoom_meeting_mode_check,
  drop constraint if exists app_settings_google_meeting_mode_check,
  drop constraint if exists app_settings_teams_meeting_mode_check;

alter table app_settings
  add constraint app_settings_zoom_meeting_mode_check
  check (zoom_meeting_mode in ('fixed_link', 'api')),
  add constraint app_settings_google_meeting_mode_check
  check (google_meeting_mode in ('fixed_link', 'api')),
  add constraint app_settings_teams_meeting_mode_check
  check (teams_meeting_mode in ('fixed_link', 'api'));

update app_settings
set
  zoom_meeting_mode = coalesce(zoom_meeting_mode, 'fixed_link'),
  google_meeting_mode = coalesce(google_meeting_mode, 'fixed_link'),
  teams_meeting_mode = coalesce(teams_meeting_mode, 'fixed_link');
