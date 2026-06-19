alter table booking_types
  alter column reminder_minutes_before set default 30,
  alter column reminder_note set default 'Ihr Termin beginnt in 30 Minuten. Bitte öffnen Sie rechtzeitig den Terminlink und halten Sie Ihre Unterlagen bereit.',
  alter column reminder_2_minutes_before set default 1440,
  alter column reminder_2_note set default 'Morgen ist Ihr Termin. Falls sich bei Ihnen etwas geändert hat, können Sie den Termin über den Link in dieser E-Mail anpassen oder stornieren.';
