alter table booking_profiles
  add column if not exists show_workflow_steps boolean not null default true;

update booking_profiles
set show_workflow_steps = true
where show_workflow_steps is null;
