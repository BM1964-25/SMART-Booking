-- Repair booking type slugs so public booking links match the visible booking type names.
-- The temporary pass avoids unique-key collisions when two rows currently have each other's slug.

update booking_types
set slug = 'repair-' || replace(id::text, '-', '');

with desired_slugs as (
  select
    id,
    coalesce(
      nullif(
        trim(
          both '-' from regexp_replace(
            replace(replace(replace(replace(lower(name), 'ä', 'ae'), 'ö', 'oe'), 'ü', 'ue'), 'ß', 'ss'),
            '[^a-z0-9]+',
            '-',
            'g'
          )
        ),
        ''
      ),
      'terminart'
    ) as base_slug,
    profile_id,
    sort_order
  from booking_types
),
numbered_slugs as (
  select
    id,
    base_slug,
    row_number() over (partition by base_slug order by profile_id nulls last, sort_order, id) as duplicate_index
  from desired_slugs
)
update booking_types booking_type
set slug = case
  when numbered_slugs.duplicate_index = 1 then numbered_slugs.base_slug
  else numbered_slugs.base_slug || '-' || numbered_slugs.duplicate_index
end
from numbered_slugs
where booking_type.id = numbered_slugs.id;
