alter table booking_types
  alter column reminder_minutes_before set default 30,
  alter column reminder_note set default 'Ihr Termin beginnt in 30 Minuten. Bitte halten Sie relevante Unterlagen bereit und nutzen Sie bei Online-Terminen den zugesendeten Link.',
  alter column reminder_2_minutes_before set default 1440,
  alter column reminder_2_note set default 'Morgen findet Ihr Termin statt. Bitte prüfen Sie kurz, ob Zeitpunkt und Terminort für Sie passen.';
