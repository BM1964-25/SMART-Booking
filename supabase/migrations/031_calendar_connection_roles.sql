alter table calendar_connections
  add column if not exists use_for_booking boolean not null default false,
  add column if not exists use_for_availability boolean not null default true;

create unique index if not exists calendar_connections_provider_calendar_id_idx
  on calendar_connections (provider, calendar_id);

create unique index if not exists calendar_connections_single_booking_calendar_idx
  on calendar_connections (provider)
  where use_for_booking = true and is_active = true;
