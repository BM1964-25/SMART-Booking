alter table booking_types
  alter column reminder_minutes_before set default 30,
  alter column reminder_note set default 'Ihr Termin beginnt in 30 Minuten. Bitte halten Sie relevante Unterlagen bereit und nutzen Sie bei Online-Terminen den zugesendeten Link.',
  alter column reminder_2_minutes_before set default 1440,
  alter column reminder_2_note set default 'Morgen findet Ihr Termin statt. Bitte prüfen Sie kurz, ob Zeitpunkt und Terminort für Sie passen.';

update booking_types
set reminder_minutes_before = 30
where reminder_minutes_before is null
  or reminder_minutes_before in (120, 1440);

update booking_types
set reminder_2_minutes_before = 1440
where reminder_2_minutes_before is null
  or reminder_2_minutes_before = 120;

update booking_types
set reminder_note = 'Ihr Termin beginnt in 30 Minuten. Bitte halten Sie relevante Unterlagen bereit und nutzen Sie bei Online-Terminen den zugesendeten Link.'
where reminder_note is null
  or btrim(reminder_note) = ''
  or reminder_note = 'Dies ist eine kurze Erinnerung: Ihr Termin beginnt in 30 Minuten.';

update booking_types
set reminder_2_note = 'Morgen findet Ihr Termin statt. Bitte prüfen Sie kurz, ob Zeitpunkt und Terminort für Sie passen.'
where reminder_2_note is null
  or btrim(reminder_2_note) = ''
  or reminder_2_note = 'Dies ist eine freundliche Erinnerung an Ihren Termin morgen.';
