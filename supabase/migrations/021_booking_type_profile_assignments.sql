create table if not exists booking_type_profiles (
  booking_type_id uuid not null references booking_types(id) on delete cascade,
  profile_id uuid not null references booking_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (booking_type_id, profile_id)
);

alter table booking_type_profiles enable row level security;

drop policy if exists "Public can read booking type profile assignments" on booking_type_profiles;
create policy "Public can read booking type profile assignments"
  on booking_type_profiles for select
  using (true);

drop policy if exists "Admins can manage booking type profile assignments" on booking_type_profiles;
create policy "Admins can manage booking type profile assignments"
  on booking_type_profiles for all
  using (exists (select 1 from admin_users where admin_users.user_id = auth.uid()))
  with check (exists (select 1 from admin_users where admin_users.user_id = auth.uid()));

create index if not exists booking_type_profiles_profile_id_idx on booking_type_profiles(profile_id);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'booking_types'
      and column_name = 'profile_id'
  ) then
    execute $migrate$
      insert into booking_type_profiles (booking_type_id, profile_id)
      select id, profile_id
      from booking_types
      where profile_id is not null
      on conflict do nothing
    $migrate$;
  end if;
end $$;

insert into booking_type_profiles (booking_type_id, profile_id)
select bt.id, bp.id
from booking_types bt
cross join booking_profiles bp
where not exists (
  select 1
  from booking_type_profiles btp
  where btp.booking_type_id = bt.id
)
and bp.is_active = true
on conflict do nothing;
