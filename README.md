# Zyklus-Tracker (PWA)

Private Zyklus- und Befindens-App für eine Person. Alle Daten bleiben auf dem
Gerät — kein Backend, kein Sync, keine Accounts. Umgesetzt nach dem Briefing in
`docs/briefing.md`.

## Schnellstart

```bash
npm install
npm run dev        # Entwicklungsserver
npm test           # Logik-Tests (Zyklusrechnung, Auswertung, Datum)
npm run build      # Produktionsbuild inkl. Service Worker und Manifest
npm run preview    # Build lokal ansehen
npm run icons      # App-Icons neu erzeugen (public/icons)
```

Beim ersten Start ist die App leer. Unter **Mehr → Testdaten** lassen sich sechs
vollständige Zyklen plus ein laufender erzeugen — damit sind Diagramme und
Wartemodus sofort sichtbar.

## Aufbau

```
src/
  config/kategorien.js   ALLE Kategorien, Tags, Wortlisten, Icons, Schwellenwerte
  config/texte.js        Phaseninfos, Sprüche, Tipps, Hinweistexte
  logik/                 reine Funktionen, ohne React und ohne Datenbank
    datum.js             lokale ISO-Daten, zeitzonensicher
    statistik.js         Median, Perzentile, Streuung
    zyklus.js            Status, Prognosefenster, Phasen, Wartemodus
    auswertung.js        Overlay, Phasenstatistik, Heatmap, Tag-Häufigkeiten
    hormone.js           idealisierter Lehrbuchverlauf
  db/                    Dexie/IndexedDB, Testdaten, Export/Import
  komponenten/           Chips, Skalen, Tageseintrag, Dialoge
  charts/                vier SVG-Diagramme, ohne Chart-Bibliothek
  ansichten/             Heute · Zyklen · Auswertung · Einstellungen · Bericht
```

**Wortlisten und Icons stehen ausschliesslich in `src/config/kategorien.js`.**
Die Komponenten enthalten keine Begriffe — Anpassungen nach den ersten Wochen
Nutzung passieren an genau dieser einen Stelle. Icons sind aktuell Emoji; sie
später durch eigene Illustrationen zu ersetzen bedeutet, nur das Feld `icon`
zu ändern.

## Die Entscheidungen, die im Code sichtbar sind

**Zyklus ist ein eigenes Objekt.** Zykluslängen werden nicht implizit aus zwei
Periodenstarts abgeleitet. Jeder Zyklus trägt `status` und `inStatistik`; nur
freigegebene Zyklen gehen in Median und Prognose ein. Eine ausgebliebene Blutung
bleibt damit als 62-Tage-Eintrag in der Historie sichtbar, ohne die Vorhersage
monatelang unbrauchbar zu machen (`logik/zyklus.js`).

**Prognose als Fenster.** Median der letzten sechs auswertbaren Zyklen, Fenster
aus dem 25.–75. Perzentil der tatsächlichen Längen. Nur ein Zyklus im Voraus.

**Wartemodus.** Ab sieben Tagen über der erwarteten Länge (frühestens ab Tag 35)
erscheint ein ruhiger Hinweis — ohne Rot, ohne Ausrufezeichen. Phase, Eisprung
und Hormonverlauf verschwinden, solange die Position im Zyklus unklar ist.
Symptome lassen sich normal weiter eintragen.

**Rückwärts zählen.** Für Symptomanalysen ist die Achse standardmässig
„Tage vor dem nächsten Periodenstart“; die Lutealphase ist relativ konstant,
dort werden Muster am schärfsten. Zusätzlich gibt es die auf 0–100 %
normalisierte Achse für Overlays.

**Ehrlichkeit bei wenig Daten.** Unter drei auswertbaren Zyklen ist die
Auswertung ausgegraut, mit Angabe, wie viele Zyklen fehlen. Balken tragen immer
Streuung, das Hormondiagramm ist als „typischer Verlauf“ beschriftet und bei
hormoneller Verhütung ganz ausgeblendet. Der geschätzte Eisprung ist als
Schätzung gekennzeichnet und ausdrücklich nicht zur Verhütung geeignet.

**Nichts eintippen.** Alle Eingaben sind Chips oder grosse Flächen. Getippt wird
nur im optionalen Notizfeld und beim einmaligen Anlegen eigener Medikamente.

**Export ist Pflichtfeature.** Safari löscht IndexedDB nach rund sieben Wochen
Nichtnutzung. Unter **Mehr → Daten sichern** gibt es JSON-Export und -Import;
der Import ersetzt den vorhandenen Bestand.

## Ohne Rechner testen: GitHub Pages

Im Repo liegt ein Workflow (`.github/workflows/pages.yml`), der bei jedem Push
baut, die Tests laufen lässt und auf GitHub Pages veröffentlicht. Einmalig
nötig, direkt im Handy-Browser:

*Repository → Settings → Pages → Source: **GitHub Actions***

Danach läuft die App unter `https://<benutzer>.github.io/<repo>/` — mit HTTPS,
also installierbar und offlinefähig. Neuer Push heisst neuer Build; die App
holt sich die Version beim nächsten Start.

Der Unterpfad wird über `BASE_PATH` gesetzt (der Workflow leitet ihn aus dem
Repo-Namen ab). Lokal zum Gegenprüfen:

```bash
BASE_PATH=/mein-repo/ npm run build
BASE_PATH=/mein-repo/ npm run preview   # dieselbe Variable, sonst 404s
```

Ohne die Variable wird wie bisher fürs Wurzelverzeichnis gebaut — passend für
Vercel, Netlify oder Cloudflare Pages.

## iOS / PWA

- Über Safari „Zum Home-Bildschirm“ installieren — nur dann läuft die App
  standalone (und nur dann wäre später Web Push möglich).
- `viewport-fit=cover` und `env(safe-area-inset-*)` sind gesetzt (Notch,
  Dynamic Island, Home-Indikator).
- Der Service Worker cached die gesamte App; sie funktioniert vollständig
  offline, weil sie ohnehin keine Netzaufrufe macht.
- Hosting: beliebiger Static-Host mit HTTPS (GitHub Pages via Workflow oben,
  sonst Vercel, Netlify, Cloudflare Pages). `npm run build`, dann `dist/`
  ausliefern.

## Android

- Chrome bietet „App installieren“ an und legt eine echte WebAPK an; dafür ist
  das maskable Icon im Manifest hinterlegt.
- Die Sieben-Wochen-Regel von Safari gilt hier nicht — der Export bleibt
  trotzdem die einzige Sicherung gegen „Speicher löschen“.
- Daten hängen an Browser und Domain: was in Chrome liegt, sieht Firefox nicht.

## Tests

`npm test` deckt die Rechenlogik ab: Datumsarithmetik über Monats- und
Zeitumstellungsgrenzen, Statusvergabe, Median und Prognosefenster, Phasen,
Rückwärtszählung, Wartemodus-Schwellen, das Ableiten von Zyklen aus
Blutungseinträgen, den ärztlichen Hinweis sowie Overlay, Phasenstatistik,
Heatmap und Tag-Häufigkeiten inklusive der Regel, dass Tage ohne Eintrag nicht
als „Symptom nicht vorhanden“ zählen.

## Grundhaltung

Die App sammelt und zeigt Daten, sie interpretiert sie nicht medizinisch. Keine
Diagnosen, keine Verhütungssicherheit, keine Schwangerschaftsaussagen. Wo
geschätzt wird, steht dabei, dass geschätzt wird. Kein Druck, keine Streaks,
keine Mahnungen bei Lücken.
