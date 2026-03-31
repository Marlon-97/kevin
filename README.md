# Curry-Bier-Abstimmung mit Node.js und TXT-Datei

Diese Anwendung stellt eine fest definierte Curry-Abstimmung bereit. Das Backend läuft mit Node.js und Express, die Stimmen werden in einer lokalen TXT-Datei gespeichert und die Ergebnisse sofort im Frontend angezeigt.

## Funktionen

- feste Curry-Bewertung mit fünf Bier-Optionen
- grafische Auswahl mit klickbaren Bier-Karten
- REST-API für Laden und Abstimmen
- Speicherung jeder Stimme in einer lokalen TXT-Datei
- ein Browser-Token in Local Storage verhindert mehrfaches Abstimmen im selben Browser
- Ergebnisanzeige mit Stimmenzahl und Prozentwerten
- Durchschnittsbewertung wird direkt angezeigt
- modernes, responsives Frontend

## Voraussetzungen

- Node.js 20 oder neuer

## Installation

```bash
npm install
```

## Konfiguration

Optional kann ein Port gesetzt werden:

```env
PORT=3000
```

## Start

Entwicklung:

```bash
npm run dev
```

Produktion:

```bash
npm start
```

Danach ist die Seite unter `http://localhost:3000` erreichbar.

## Feste Abstimmung anpassen

Die fest definierte Abstimmung liegt in `src/config.js`.

Dort können geändert werden:

- Titel
- Beschreibung
- Antwortoptionen
- Poll-ID

## API

`GET /api/poll`
- liefert die Abstimmung inklusive aktuellem Ergebnis

`POST /api/vote`
- erwartet JSON wie:

```json
{
  "optionId": "5-beers",
  "voterToken": "browser-token"
}
```

## Speicherung

Die Stimmen werden in `data/votes.txt` gespeichert. Jede Zeile enthält:

- Poll-ID
- Option-ID
- Browser-Token
- Zeitstempel

## Projektstruktur

```text
public/
  app.js
  index.html
  styles.css
src/
  config.js
  storage.js
  server.js
```
