create table if not exists app_settings (
  id boolean primary key default true,
  active_calendar_provider text not null default 'apple' check (active_calendar_provider in ('apple', 'google', 'microsoft')),
  smtp_host text default 'smtp-relay.brevo.com',
  smtp_port integer default 587,
  smtp_user text,
  smtp_password text,
  mail_from text,
  booking_owner_email text,
  zoom_meeting_url text,
  zoom_meeting_mode text not null default 'fixed_link' check (zoom_meeting_mode in ('fixed_link', 'api')),
  zoom_account_id text,
  zoom_client_id text,
  zoom_client_secret text,
  teams_meeting_url text,
  teams_meeting_mode text not null default 'fixed_link' check (teams_meeting_mode in ('fixed_link', 'api')),
  google_meet_url text,
  google_meeting_mode text not null default 'fixed_link' check (google_meeting_mode in ('fixed_link', 'api')),
  google_client_id text,
  google_client_secret text,
  onsite_meeting_url text,
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id = true)
);

insert into app_settings (id)
values (true)
on conflict (id) do nothing;
