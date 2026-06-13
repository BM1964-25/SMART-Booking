# SMART Booking

Professionelle Terminbuchungs-App für BuiltSmart AI. Die App nutzt Next.js App Router, TypeScript, Tailwind CSS, Supabase, CalDAV für Apple iCloud Kalender und SMTP/Brevo für E-Mail-Bestätigungen.

## Installation

```bash
npm install
cp .env.example .env.local
npm run dev
```

Danach ist die App lokal unter `http://localhost:3000` erreichbar.

## Supabase einrichten

### Option A: Supabase Cloud

1. Neues Supabase-Projekt erstellen.
2. SQL aus `supabase/migrations/001_initial_schema.sql` im Supabase SQL Editor ausführen.
3. In Supabase unter Project Settings > API diese Werte kopieren:
   - Project URL
   - anon public key
   - service_role key
4. `.env.local` anlegen und die Werte setzen:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

5. In Supabase Auth einen Admin-Benutzer anlegen.
6. Die User-ID dieses Admins in `admin_users` eintragen.

Beispiel:

```sql
insert into admin_users (user_id, email, role)
values ('AUTH_USER_UUID', 'bernhard@builtsmart-ai.app', 'owner');
```

### Option B: Supabase lokal

Voraussetzung: Docker Desktop läuft.

```bash
npm run supabase:start
npm run supabase:db:reset
npm run supabase:status
```

`supabase:status` zeigt lokale URL, anon key und service_role key. Diese Werte in `.env.local` übernehmen.

Danach in Supabase Studio unter `http://localhost:54323` einen Auth-Benutzer anlegen und dessen ID in `admin_users` eintragen.

## Apple CalDAV einrichten

Apple Kalender erfordert für externe Apps ein app-spezifisches Passwort.

1. Auf `https://appleid.apple.com` anmelden.
2. Unter Anmeldung und Sicherheit ein app-spezifisches Passwort erzeugen.
3. In `.env.local` setzen:
   - `APPLE_CALDAV_URL=https://caldav.icloud.com`
   - `APPLE_CALDAV_USERNAME=<Apple-ID>`
   - `APPLE_CALDAV_APP_PASSWORD=<app-spezifisches Passwort>`
4. `GET /api/calendar/test` aufrufen, um die Verbindung zu prüfen.
5. Den passenden Kalender aus der Antwort auswählen und dessen URL in `APPLE_CALENDAR_ID` speichern.

Die App liest belegte Zeiten über CalDAV und schreibt neue Buchungen als VEVENT in den Apple Kalender.

## Brevo SMTP einrichten

Die App versendet Bestätigungs- und Storno-Mails über SMTP. Für Brevo werden folgende Variablen benötigt:

```bash
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=<Brevo SMTP Login>
SMTP_PASSWORD=<Brevo SMTP Key>
MAIL_FROM=SMART Booking <termine@builtsmart-ai.app>
```

In Brevo muss die Absenderdomain oder Absenderadresse freigegeben sein. Danach die Variablen in Vercel eintragen und ein neues Deployment starten.

## Terminorte und Meeting-Links

Im Buchungsformular kann der Kunde zwischen Telefon, Zoom, Microsoft Teams, Google Meet, Ortstermin und individueller Abstimmung wählen. Die Auswahl wird in Supabase gespeichert und in Apple Kalender, ICS-Datei und E-Mail übernommen.

Optional können feste Links hinterlegt werden:

```bash
ZOOM_MEETING_URL=https://...
TEAMS_MEETING_URL=https://...
GOOGLE_MEET_URL=https://...
ONSITE_MEETING_URL=https://...
```

Wenn diese Werte gesetzt sind, werden sie in Bestätigungs-E-Mails und Kalendereinträgen klickbar ausgegeben.

Für Zoom kann die App automatisch pro Buchung einen individuellen Link erzeugen. Dafür werden in Vercel zusätzlich diese Werte aus einer Zoom Server-to-Server-OAuth-App benötigt:

```bash
ZOOM_ACCOUNT_ID=
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
```

Wenn diese Zoom-Werte fehlen, nutzt die App `ZOOM_MEETING_URL` als festen Raum. Microsoft Teams und Google Meet benötigen für automatisch erzeugte Einzellinks später eine zusätzliche Integration mit Microsoft Graph bzw. Google Calendar/Meet API.

## Vercel Deployment

1. Repository mit Vercel verbinden.
2. Framework Preset: Next.js.
3. Alle Environment Variables aus `.env.example` in Vercel setzen.
4. Domain `termine.builtsmart-ai.app` in Vercel hinzufügen.
5. DNS CNAME für `termine` auf Vercel konfigurieren.
6. Build Command: `npm run build`.

Vor dem Livegang die Checkliste in `docs/live-checklist.md` abarbeiten. Besonders wichtig: Supabase Secret Key und Apple app-spezifisches Passwort neu erzeugen, falls sie während der Einrichtung in Chat oder lokalen Logs sichtbar waren.

## Technische Dokumentation

- `src/app` enthält Pages und API Routes.
- `src/lib/availability.ts` berechnet freie Slots aus Verfügbarkeitsregeln, bestehenden Supabase-Buchungen, blockierten Zeiten, Apple-Kalender-Events und Pufferzeiten.
- `src/lib/calendar/caldav.ts` kapselt CalDAV-Zugriffe auf Apple iCloud.
- `src/lib/email.ts` versendet Kundenbestätigungen und interne Benachrichtigungen über SMTP/Brevo. Eine ICS-Datei wird als Fallback angehängt.
- `src/lib/supabase` trennt Browser-, Server- und Admin-Clients. Der Service Role Key wird nur serverseitig verwendet.
- `src/lib/rate-limit.ts` enthält ein einfaches In-Memory-Rate-Limit für Buchungs-API-Aufrufe. Für hohes Volumen sollte Vercel KV oder Upstash Redis genutzt werden.

## Wichtige Routen

- `/` öffentliche Startseite
- `/book` Terminart auswählen
- `/book/[type]` Datum und Uhrzeit auswählen
- `/book/[type]/confirm` Daten eingeben und Buchung bestätigen
- `/success` Buchung bestätigt
- `/cancel/[token]` Stornierung
- `/admin` Admin Dashboard
- `/admin/bookings` Buchungsübersicht
- `/admin/settings` Einstellungen

## Was nach Supabase-Konfiguration aktiv ist

- `/book` liest Terminarten aus `booking_types`.
- `/book/[type]` berechnet echte freie Slots.
- `/book/[type]/confirm` speichert Buchungen in `bookings`.
- `/admin/login` nutzt Supabase Auth.
- `/admin/settings` verwaltet Terminarten und Verfügbarkeiten direkt in Supabase.
- `/admin/bookings` zeigt gespeicherte Buchungen.

## API

- `POST /api/bookings/create`
- `GET /api/availability`
- `POST /api/bookings/cancel`
- `GET /api/admin/bookings`
- `POST /api/admin/booking-types`
- `POST /api/admin/availability`
- `GET /api/calendar/test`
- `GET /api/calendar/events`
- `GET /api/email/test`
