alter table booking_types
  alter column reminder_note set default 'Unser Termin beginnt in {zeit}. Ich freue mich auf das Gespräch.',
  alter column reminder_2_note set default 'Zur Erinnerung: Unser Termin findet in {zeit} statt. Ich freue mich auf den Austausch mit Ihnen.';

update booking_types
set reminder_note = 'Unser Termin beginnt in {zeit}. Ich freue mich auf das Gespräch.'
where reminder_note is null
  or btrim(reminder_note) = ''
  or reminder_note in (
    'Dies ist eine kurze Erinnerung: Ihr Termin beginnt in 30 Minuten.',
    'Ihr Termin beginnt in 30 Minuten. Bitte halten Sie relevante Unterlagen bereit und nutzen Sie bei Online-Terminen den zugesendeten Link.',
    'Ihr Termin beginnt in 30 Minuten. Bitte öffnen Sie rechtzeitig den Terminlink und halten Sie Ihre Unterlagen bereit.'
  );

update booking_types
set reminder_2_note = 'Zur Erinnerung: Unser Termin findet in {zeit} statt. Ich freue mich auf den Austausch mit Ihnen.'
where reminder_2_note is null
  or btrim(reminder_2_note) = ''
  or reminder_2_note in (
    'Dies ist eine freundliche Erinnerung an Ihren Termin morgen.',
    'Morgen findet Ihr Termin statt. Bitte prüfen Sie kurz, ob Zeitpunkt und Terminort für Sie passen.',
    'Morgen ist Ihr Termin. Falls sich bei Ihnen etwas geändert hat, können Sie den Termin über den Link in dieser E-Mail anpassen oder stornieren.'
  );
