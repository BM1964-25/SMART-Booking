with ranked_booking_types as (
  select
    id,
    row_number() over (
      partition by profile_id
      order by sort_order, created_at, id
    ) as position
  from booking_types
)
update booking_types bt
set sort_order = least(ranked_booking_types.position, 4)
from ranked_booking_types
where bt.id = ranked_booking_types.id;

alter table booking_types
  alter column sort_order set default 1;

alter table booking_types
  drop constraint if exists booking_types_sort_order_range;

alter table booking_types
  add constraint booking_types_sort_order_range
  check (sort_order between 1 and 4);
