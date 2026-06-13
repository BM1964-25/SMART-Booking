update booking_types
set
  name = 'Kostenloses Erstgespräch',
  description = 'Kurzes Kennenlernen und Einordnung Ihres Vorhabens.'
where slug = 'erstgespraech';

update booking_types
set
  name = 'Projektanalyse',
  description = 'Strukturierte Analyse Ihres Projekts und nächste Schritte.'
where slug = 'projektanalyse';

update booking_types
set
  name = 'Beratung Bau und Immobilien',
  description = 'Fachliche Beratung für Bau- und Immobilienprozesse.'
where slug = 'beratung-bau-immobilien';
