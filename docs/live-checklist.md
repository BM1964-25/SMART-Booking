# Livegang-Checkliste

Vor dem echten Deployment auf Vercel:

1. Supabase Secret Key rotieren, weil der aktuelle Key während der lokalen Einrichtung im Chat verwendet wurde.
2. Apple app-spezifisches Passwort für SMART Booking neu erzeugen und das alte Passwort widerrufen.
3. Neue Werte ausschließlich in Vercel Environment Variables eintragen.
4. `.env.local` lokal behalten, aber niemals committen oder veröffentlichen.
5. Resend API-Key eintragen und Testmail auslösen.
6. Admin-Benutzer prüfen.
7. Testbuchung durchführen und im Apple Kalender kontrollieren.
