alter table booking_types
  alter column reminder_minutes_before set default 30,
  alter column reminder_note set default 'Unser Termin beginnt in {zeit}. Ich freue mich auf das Gespräch.',
  alter column reminder_2_minutes_before set default 1440,
  alter column reminder_2_note set default 'Zur Erinnerung: Unser Termin findet in {zeit} statt. Ich freue mich auf den Austausch mit Ihnen.';
