alter table booking_profiles
  add column if not exists contact_icon_order jsonb not null default '["email","phone","website","linkedin","xing","x","instagram","facebook","youtube","spotify"]'::jsonb;
