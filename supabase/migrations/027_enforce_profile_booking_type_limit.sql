alter table booking_types
  add column if not exists profile_id uuid references booking_profiles(id) on delete set null;

update booking_types bt
set profile_id = assigned.profile_id
from (
  select distinct on (booking_type_id)
    booking_type_id,
    profile_id
  from booking_type_profiles
  order by booking_type_id, created_at
) assigned
where bt.id = assigned.booking_type_id
  and bt.profile_id is null;

update booking_types
set profile_id = (
  select id
  from booking_profiles
  order by created_at
  limit 1
)
where profile_id is null
  and exists (select 1 from booking_profiles);

create or replace function enforce_booking_type_profile_limit()
returns trigger
language plpgsql
as $$
declare
  existing_count integer;
begin
  if new.profile_id is null then
    raise exception 'Eine Terminart muss einem Profil zugeordnet sein.';
  end if;

  if tg_op = 'INSERT' then
    select count(*)
    into existing_count
    from booking_types
    where profile_id = new.profile_id
      and id <> new.id;

    if existing_count >= 4 then
      raise exception 'Ein Profil kann maximal vier Terminarten enthalten.';
    end if;
  elsif new.profile_id is distinct from old.profile_id then
    select count(*)
    into existing_count
    from booking_types
    where profile_id = new.profile_id
      and id <> new.id;

    if existing_count >= 4 then
      raise exception 'Ein Profil kann maximal vier Terminarten enthalten.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists booking_types_profile_limit_trigger on booking_types;

create trigger booking_types_profile_limit_trigger
before insert or update of profile_id on booking_types
for each row
execute function enforce_booking_type_profile_limit();

create index if not exists booking_types_profile_sort_idx on booking_types(profile_id, sort_order);
