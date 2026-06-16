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

create index if not exists booking_types_profile_sort_idx on booking_types(profile_id, sort_order);
