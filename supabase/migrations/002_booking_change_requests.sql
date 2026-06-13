create table if not exists booking_change_requests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  proposed_starts_at timestamptz,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now()
);

create index if not exists booking_change_requests_booking_id_idx on booking_change_requests(booking_id);
create index if not exists booking_change_requests_status_idx on booking_change_requests(status);

alter table booking_change_requests enable row level security;

create policy "Admins can manage booking change requests"
  on booking_change_requests for all
  using (exists (select 1 from admin_users where admin_users.user_id = auth.uid()))
  with check (exists (select 1 from admin_users where admin_users.user_id = auth.uid()));
