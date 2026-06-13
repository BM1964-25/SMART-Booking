update booking_types
set duration_minutes = 30
where slug in (
  'erstgespraech',
  'ki-demo-builtsmart-ai',
  'projektanalyse',
  'beratung-bau-immobilien'
);
