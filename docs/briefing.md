# Projektbriefing: Zyklus-Tracking-App (PWA)

Dieses Dokument ist die Spezifikation für eine private Zyklus-Tracking-App.
Es beschreibt, **was** gebaut wird und **warum** bestimmte Entscheidungen so
getroffen wurden. Umsetzungsdetails (konkrete Komponenten-Struktur,
Styling) sind bewusst offen gelassen.

---

## 1. Ziel und Rahmen

Eine persönliche App zum täglichen Erfassen von Zyklus, Befinden und Symptomen,
mit dem Schwerpunkt auf **Auswertung**: Ich möchte sehen, wie sich Stimmung,
Energie, Schmerzen und Haut über den Zyklus verändern.

**Nutzerin:** eine einzelne Person (ich), kein Mehrbenutzerbetrieb.

**Wichtigste Anforderung an die Bedienung:** Es wird **nichts eingetippt**.
Alle Eingaben erfolgen durch Antippen von Optionen. Ausnahme: ein optionales
Freitext-Notizfeld pro Tag und das einmalige Anlegen eigener Medikamente in
den Einstellungen.

---

## 2. Technischer Rahmen

- **PWA** (Progressive Web App), primäres Zielgerät: iPhone / Safari,
  installiert über „Zum Home-Bildschirm"
- **React + Vite**, `vite-plugin-pwa` für Manifest und Service Worker
- **IndexedDB** für alle Daten (z. B. via Dexie.js)
- **Kein Backend, kein Sync, keine Accounts.** Alle Daten bleiben auf dem Gerät.
- Hosting später auf Vercel / Netlify / Cloudflare Pages (HTTPS erforderlich)

### Warum local-only

Zyklusdaten sind nach DSGVO Art. 9 besonders schützenswert. Ohne Server gibt es
kein Datenleck, keine Auskunftspflichten, kein zu härtendes Backend.

### iOS-spezifische Punkte

- Web Push funktioniert nur bei installierter PWA, nicht im Safari-Tab
- `viewport-fit=cover` + `env(safe-area-inset-*)` für Notch / Dynamic Island
- **Wichtig:** Safari kann IndexedDB löschen, wenn die App ~7 Wochen ungenutzt
  bleibt. Deshalb ist ein **Export als JSON-Datei Pflichtfeature**, kein
  Nice-to-have. Ebenso ein Import zum Wiederherstellen.

---

## 3. Datenmodell

### 3.1 Grundprinzip: Zyklus ist ein eigenes Objekt

Ein Zyklus wird **nicht** implizit aus der Differenz zweier Periodenstarts
berechnet. Sonst erzeugt eine ausbleibende Blutung einen 62-Tage-„Zyklus", der
den Median verzerrt und die Prognose monatelang unbrauchbar macht.

```
Cycle {
  id
  startDate            // erster Tag der Blutung
  endDate?             // letzter Tag der Blutung
  status               // 'normal' | 'lang' | 'ausgeblieben' | 'unklar'
  inStatistik: boolean // fließt dieser Zyklus in Median/Prognose ein?
}
```

Nur Zyklen mit `inStatistik: true` gehen in Berechnungen ein. Ausgebliebene oder
unklare Zyklen bleiben in der Historie sichtbar — sie sind die wichtigste
Information überhaupt — verzerren aber keine Vorhersage.

### 3.2 Tageseintrag

```
DayEntry {
  date                 // Primärschlüssel, ein Eintrag pro Tag

  // --- Skalen (Single-Select, geordnet) ---
  blutung              // 0 = keine | 1 = Schmierblutung | 2 = leicht
                       // 3 = mittel | 4 = stark
  stimmung             // 1–5 Gesamtwert
  energie              // 1 = energielos | 2 = müde | 3 = okay | 4 = energiegeladen

  // --- Tags (Multi-Select, ungeordnet) ---
  gefuehle: []
  geist: []
  haut: []
  sozial: []
  ausfluss: []

  // --- Strukturiert ---
  schmerzen: [ { region, art, intensitaet } ]
  sex: { aktivitaet?, verhuetung?, libido? }
  medikamente: [ medikamentId ]

  notiz?               // optionaler Freitext
}
```

### 3.3 Einstellungen

```
Settings {
  hormonelleVerhuetung: boolean
  sichtbareKategorien: []      // Kategorien einzeln abschaltbar
  eigeneMedikamente: [ { id, name, dosis? } ]
  favoritenTags: []            // für die Schnellansicht
}
```

---

## 4. Skalen vs. Tags — der zentrale Unterschied

Das ist die wichtigste Designentscheidung und bestimmt die gesamte Auswertung:

| Typ | Beispiele | Auswertung |
|---|---|---|
| **Skala** (geordnet) | Blutungsstärke, Stimmung, Energie, Schmerzintensität | Linie / Kurve über den Zyklus, Mittelwert pro Phase |
| **Tag** (ungeordnet) | Gefühle, Geist, Haut, Sozial, Ausfluss | Häufigkeit pro Phase, z. B. „reizbar an 68 % der Lutealtage vs. 12 % follikulär" |

**Warum zusätzlich ein Gesamt-Stimmungswert 1–5 neben den Gefühls-Tags?**
Ohne ihn lässt sich nur sagen „ich habe luteal öfter *traurig* getippt", nicht
„mir ging es luteal schlechter". Die Skala macht Vergleiche über Phasen
überhaupt erst möglich.

---

## 5. Kategorien im Detail

Alle Optionen erscheinen als antippbare Chips mit **Icon + Wort**. Das Wort
steht immer dabei — reine Bilder sind besonders bei Gefühlen mehrdeutig.

### Blutung (Skala, Single-Select)
keine · Schmierblutung · leicht · mittel · stark

### Gefühle (Tags, Multi-Select)
Stimmungsschwankungen · Kontrollverlust · gut · fröhlich · traurig · sensibel ·
wütend · selbstbewusst · reizbar · unruhig · unsicher · dankbar

### Energie (Skala, Single-Select)
energielos · müde · okay · energiegeladen

### Geist (Tags)
vergesslich · Brain Fog · gestresst · konzentriert · motiviert · unmotiviert ·
klar · überfordert

### Sozial (Tags)
gesellig · unterstützend · streitlustig · zurückgezogen · anhänglich

### Haut (Tags)
gut · Pickel · trocken · fettig · gerötet · empfindlich

### Ausfluss (Tags)
keiner · cremig · klebrig · wässrig · eiweißartig · untypisch

### Schmerzen (strukturiert)

Zweistufige Eingabe, **nicht** als flache Liste — sonst explodiert die Anzahl
der Optionen:

1. **Region antippen:** Unterleib · unterer Rücken · Kopf · Brust · Beine ·
   Gelenke · Magen/Darm
2. Danach erscheinen **Art** (krampfartig · stechend · ziehend · dumpf ·
   brennend) und **Intensität** (1–3: leicht · mittel · stark)

Mehrere Schmerz-Einträge pro Tag möglich.

### Sexleben (getrennt erfassen)

Aufgeteilt in **Aktivität**, **Verhütung** und **Libido**. Nur Libido ist für
die Zyklusauswertung interessant, die anderen beiden sind Protokoll.

**Diese Kategorie muss sich vollständig ausblenden lassen** (Einstellungen) —
für Situationen, in denen jemand mit auf den Bildschirm schaut.

### Medikamente

Lässt sich nicht vorgeben. Deshalb: Präparate einmal in den Einstellungen
anlegen, danach sind sie ganz normale antippbare Chips wie alles andere.

---

## 6. Zyklusberechnung

### 6.1 Prognose

- Basis: **Median** der letzten 6 Zyklen mit `inStatistik: true`
  (robuster gegen Ausreißer als der Mittelwert)
- Ausgabe ist **kein einzelnes Datum, sondern ein Fenster**, abgeleitet aus den
  tatsächlichen Perzentilen der bisherigen Zyklen — z. B. „25.–29."
  Ein exaktes Datum bei schwankenden Zyklen wäre eine Scheingenauigkeit.
- **Nur ein Zyklus im Voraus.** Keine Kalenderansicht über mehrere Monate — bei
  realistischer Streuung wäre der übernächste Zyklus ein Zehn-Tage-Fenster und
  damit wertlos.

### 6.2 Phasen

- **Follikelphase:** Periodenstart bis Eisprung — variabel lang
- **Lutealphase:** Eisprung bis nächste Periode — relativ konstant ~14 Tage
- Eisprung: geschätzt ca. 14 Tage **vor** dem erwarteten nächsten Periodenstart

### 6.3 Ausbleibende Periode

Ab **7 Tagen über der erwarteten Zykluslänge** (oder ab Tag 35, je nachdem was
später eintritt) erscheint ein ruhiger Hinweis — **ohne rote Farbe, ohne
Ausrufezeichen**. Verspätungen sind häufig, und Stress verzögert zusätzlich.

Auswahl: *hatte sie, nur nicht eingetragen* / *noch nicht gekommen* /
*nicht sicher*

**Wartemodus:** Solange die Periode überfällig ist, werden Phasenanzeige,
Hormondiagramm und Eisprungberechnung **ausgeblendet**. In einem unklaren Zyklus
ist die Position unbekannt, und eine erfundene „Lutealphase, Tag 19" wäre
schlicht falsch. Stattdessen: „Zyklustag 41 · Periode überfällig seit 6 Tagen."
Symptome können normal weiter eingetragen werden.

**Ärztlicher Hinweis:** Bei drei ausgebliebenen Zyklen in Folge oder über 90
Tagen ohne Blutung **einmalig** dezent erwähnen, dass das ärztlich abgeklärt
gehört. Kein Dauerbanner, keine Diagnosevorschläge.

---

## 7. Auswertung und Diagramme

### 7.1 Phasen-Zuordnung: rückwärts zählen

Zyklen sind unterschiedlich lang — „Tag 12 in Zyklus A" und „Tag 12 in Zyklus B"
sind nicht dasselbe. Zwei Verfahren:

1. **Rückwärts ab dem nächsten Periodenstart** (Tag −1, −2, …) — bevorzugt für
   Symptom-Analysen. Die Lutealphase ist relativ konstant, dort liegen die
   meisten PMS-Effekte. Rückwärts gezählt wird das Muster deutlich schärfer.
2. **Zyklus auf 0–100 % normalisiert** — für Overlay-Darstellungen über mehrere
   Zyklen.

Vorwärts zählen verwischt genau das, was sichtbar werden soll, weil sich die
Follikelphase dehnt und staucht.

### 7.2 Diagramme

**Overlay-Linie**
Alle Zyklen normalisiert übereinandergelegt, dahinter farbige Phasenbänder.
Zeigt, ob überhaupt ein Muster existiert. Für Skalen (Stimmung, Energie).

**Balken pro Phase**
Durchschnitt **mit Streuung** (Whisker oder Perzentile). Ohne Streuungsangabe
wird eine Präzision suggeriert, die die Daten nicht hergeben.

**Heatmap**
Zeilen = Zyklen, Spalten = Zyklustage, Farbe = Wert. Das beste Werkzeug zum
Mustererkennen, sobald 4–5 Zyklen vorliegen.

**Tag-Häufigkeiten**
Pro Tag-Kategorie: Wie oft trat dieses Tag in Follikel- vs. Lutealphase vs.
Menstruation auf, in Prozent der jeweiligen Tage.

### 7.3 Ehrlichkeit bei wenig Daten

**Unter drei vollständigen Zyklen werden Auswertungen ausgegraut** — mit
Hinweis, wie viele Zyklen noch fehlen. Rauschen darf nicht als Erkenntnis
verkauft werden.

Stimmung hat viele Confounder (Schlaf, Wochentag, Stress). Das darf die App
ruhig erwähnen, statt Korrelation als Ursache darzustellen.

### 7.4 Hormondiagramm — klare Kennzeichnung nötig

Das ist **kein Diagramm der eigenen Hormone**, sondern ein idealisierter
Lehrbuchverlauf (Östrogen, Progesteron, LH, FSH), skaliert auf die eigene
Zykluslänge. Ohne Blut- oder LH-Tests misst die App nichts davon.

- Muss sichtbar beschriftet sein: **„typischer Verlauf"**
- Bei `hormonelleVerhuetung: true` **komplett ausblenden** — dann stimmt die
  Kurve nicht
- Ebenso ausgeblendet im Wartemodus (siehe 6.3)

Analog beim Eisprung: Die Kalenderberechnung ist eine Schätzung mit mehreren
Tagen Unsicherheit und **nicht zur Verhütung geeignet**. Ein Satz dazu in der
App.

### 7.5 Muster über die Zeit

Weil ausgebliebene Zyklen echte Datenpunkte sind, lassen sie sich auswerten:
Wie oft im letzten Jahr? Häufen sie sich nach stressigen Phasen? Wird die
Streuung größer?

**Export für das Arztgespräch:** Übersicht der letzten Zyklen (Länge, Status,
auffällige Symptome) als Liste oder PDF.

---

## 8. Inhalte: Infos, Sprüche, Tipps

**Phaseninfos**
Kurze Erklärtexte: Was ist die Lutealphase, was passiert hormonell, was ist
typisch. Sachlich, ohne Ratgeber-Ton.

**Sprüche je nach Phase**
Nicht nur an die Phase gekoppelt, sondern auch an die **aktuellen Daten**: Bei
drei Tagen mit „gestresst" ein anderer Ton als bei „energiegeladen".

- Eher zurückhaltend als motivierend-laut — laute Texte nutzen sich schnell ab
- Einzelne Sprüche müssen sich wegwischen lassen

**Tipps je nach Phase**
Was hilft in dieser Phase: Bewegung, Ruhe, Ernährung, Schlaf. Als Vorschlag
formuliert, nicht als Anweisung.

---

## 9. Bedienung

### 9.1 Der Tageseintrag muss schnell gehen

Bei 10 Kategorien dauert ein vollständiger Eintrag sonst zwei Minuten — und wird
nach drei Wochen nicht mehr ausgefüllt. Die Auswertung ist aber nur so gut wie
die Regelmäßigkeit der Einträge.

- **Schnellansicht:** die 8 meistgenutzten Tags ganz oben, Rest aufklappbar
- Kategorien einzeln abschaltbar (Einstellungen)
- Skalen als Schieberegler oder große Buttons — in wenigen Sekunden erledigt

### 9.2 Icons

Realistisch sind 60–80 Symbole. Das ist der größte versteckte Aufwand im
Projekt.

- Für Haut, Energie, Schmerz gibt es brauchbare Sets (**Lucide**, **Phosphor**)
- Für Gefühle wie „Kontrollverlust" oder „sensibel" existiert nichts Passendes
- **Startpunkt:** Farbe + Emoji + Wort. Später durch eigene Illustrationen
  ersetzbar — deshalb muss das Icon pro Tag **in der Konfiguration** stehen,
  nicht im Komponentencode

---

## 10. Umsetzungsreihenfolge

Jeder Schritt soll lauffähig sein:

1. **Datenmodell + IndexedDB-Layer**, dazu ein Skript, das **Testdaten für sechs
   Zyklen** erzeugt. Ohne Testdaten sind die Diagramme monatelang nicht sichtbar
   und nicht entwickelbar.
2. **Tageseintrag** mit allen Kategorien
3. **Zyklusberechnung** inklusive Statusverwaltung und Wartemodus
4. **Diagramme und Auswertung**
5. **PWA-Konfiguration**, Texte, Export/Import, Feinschliff

### Wichtige Struktur-Vorgabe

**Alle Kategorien, Tags, Wortlisten und Icons gehören in eine einzige
Konfigurationsdatei** (z. B. `src/config/kategorien.js`), nicht verstreut in die
Komponenten. Die Wortlisten werden nach den ersten Wochen Nutzung mehrfach
angepasst — das soll an genau einer Stelle passieren.

---

## 11. Grundhaltung der App

- Sie **sammelt und zeigt** Daten. Sie **interpretiert sie nicht medizinisch**.
- Keine Diagnosen, keine Verhütungssicherheit, keine Schwangerschaftsaussagen.
- Wo geschätzt wird, steht dabei, dass geschätzt wird.
- Unsicherheit wird als Spanne dargestellt, nicht als exakter Wert versteckt.
- Kein Druck, keine Streaks, keine Mahnungen bei Lücken.
