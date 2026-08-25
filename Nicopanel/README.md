# NicoPanel Beta 0.1

Professionelles Arbeits- und Fallmanagement-Dashboard als erste UI-/Funktionsbeta für rechtliche Betreuung und Sozialbetreuung.

## Enthalten

- Dashboard mit offenen Fristen, E-Mails, aktiven Akten und Notizen
- Kalender mit Kategorien Frist, Termin und Wiedervorlage
- E-Mail-Posteingang als Beta-Demo
- automatische Erkennung von Datumsangaben in E-Mails
- automatische Anlage erkannter Fristen/Termine im Kalender
- E-Mails einer Personenakte zuordnen
- ausklappbare Personenakten mit E-Mails, Fristen/Terminen und Notizen
- neue Personenakte anlegen
- Notizen je Akte speichern
- lokale Speicherung im Browser via localStorage
- responsive Desktop-/Tablet-/Mobile-Oberfläche

## Cloudflare Pages

Repository: `Didikoral1/Minecraft-Developer`
Branch: `nicopanel-beta`
Root directory: `Nicopanel`

Die Beta ist statisch. Es ist kein Build-Schritt nötig. Wenn Cloudflare nach einem Build Command fragt, leer lassen. Als Output-/Build-Verzeichnis kann bei einer statischen Pages-Konfiguration die Projektwurzel verwendet werden.

## Wichtiger Beta-Hinweis

Diese Version verwendet ausschließlich lokale Demodaten und `localStorage`. Es werden keine echten E-Mail-Konten, personenbezogenen Daten oder Serverdaten synchronisiert.

Vor produktiver Nutzung mit echten Betreuungsdaten sollten mindestens umgesetzt werden:

1. Authentifizierung und Rollen-/Rechteverwaltung
2. Cloudflare D1 oder ein geeignetes verschlüsseltes Backend
3. serverseitige Validierung und Audit-Log
4. sichere OAuth-Anbindung an den gewünschten Mailanbieter
5. Datenschutz-/Lösch-/Exportkonzept und Backups
6. Verschlüsselung sensibler Felder und Secret-Management
7. Fristenerkennung mit Bestätigung statt ungeprüfter automatischer Rechtswirkung

## Nächster Ausbauschritt

Beta 0.2 kann echte Benutzerkonten, D1-Persistenz, Akten-Dokumente, Aufgaben, Erinnerungen und eine sichere Mail-Synchronisation erhalten.