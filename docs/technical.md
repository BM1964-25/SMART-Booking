# Technische Dokumentation

## Architektur

SMART Booking ist eine serverzentrierte Next.js-App. Sensible Operationen wie CalDAV-Zugriffe, Supabase-Service-Role-Zugriffe und E-Mail-Versand laufen ausschließlich in Route Handlers oder Server Components.

## Buchungsablauf

1. Kunde wählt eine Terminart.
2. App berechnet freie Slots für einen Zeitraum in `Europe/Berlin`.
3. Kunde sendet Kontaktdaten und Datenschutz-Zustimmung.
4. Server validiert alle Eingaben mit Zod.
5. Server prüft den Slot erneut gegen Supabase, blocked times und Apple Kalender.
6. Buchung wird in Supabase gespeichert.
7. Apple Kalender-Event wird via CalDAV erstellt.
8. Kunde und Betreiber erhalten E-Mails. Eine ICS-Datei dient als Fallback.

## Kalenderstrategie

Die App nutzt `tsdav` für:

- Apple CalDAV Login
- Kalenderliste
- Event-Abfrage in Zeiträumen
- VEVENT-Erstellung
- Event-Löschung bei Stornierung

Apple Kalender-Zugangsdaten werden nie an den Browser ausgeliefert.

## Sicherheit

- Admin-Seiten prüfen Supabase Auth und Eintrag in `admin_users`.
- RLS ist für alle Tabellen aktiviert.
- Schreibende Public-Operationen laufen über serverseitige Validierung.
- Buchungen werden vor Insert und Kalendererstellung erneut auf Verfügbarkeit geprüft.
- Stornierungen verwenden nicht erratbare Tokens.
- Rate Limiting ist für `/api/bookings/create` vorgesehen.

## Erweiterungen für Produktion

- In-Memory-Rate-Limit durch Upstash Redis oder Vercel KV ersetzen.
- Observability über Vercel Logs, Sentry oder Axiom ergänzen.
- Admin-Formulare für Kalenderverbindung ausbauen, falls mehrere Kalender verwaltet werden sollen.
- E-Mail-Templates branden und rechtlich prüfen.
