alter table booking_types
  alter column reminder_minutes_before set default 30,
  alter column reminder_note set default 'Dies ist eine kurze Erinnerung: Ihr Termin beginnt in 30 Minuten.',
  alter column reminder_2_minutes_before set default 1440,
  alter column reminder_2_note set default 'Dies ist eine freundliche Erinnerung an Ihren Termin morgen.';
