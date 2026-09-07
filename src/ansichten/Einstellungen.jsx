/**
 * Einstellungen: Kategorien abschalten, eigene Medikamente, Schnellansicht,
 * Export/Import (Pflichtfeature) und Testdaten.
 */

import { useRef, useState } from 'react'
import {
  ALLE_TAGS,
  KATEGORIEN,
  SCHNELLANSICHT_ANZAHL,
  tagInfo,
} from '../config/kategorien.js'
import { HINWEISE } from '../config/texte.js'
import { dateiLesen, datenImportieren, exportHerunterladen } from '../db/backup.js'
import { testdatenEntfernen, testdatenLaden } from '../db/testdaten.js'
import { allesLoeschen } from '../db/eintraege.js'
import { Chip, Dialog, Wippe, useMeldung } from '../komponenten/Basis.jsx'
import { formatMitJahr } from '../logik/datum.js'

export default function Einstellungen({ daten }) {
  const { einstellungen, einstellungenSpeichern, eintraege, zyklen } = daten
  const [meldung, setMeldung] = useMeldung()
  const [medikamenteOffen, setMedikamenteOffen] = useState(false)
  const [favoritenOffen, setFavoritenOffen] = useState(false)
  const [loeschenOffen, setLoeschenOffen] = useState(false)
  const dateiFeld = useRef(null)

  const versteckt = einstellungen.versteckteKategorien || []
  const kategorieUmschalten = (id, sichtbar) =>
    einstellungenSpeichern({
      versteckteKategorien: sichtbar ? versteckt.filter((k) => k !== id) : [...versteckt, id],
    })

  const importieren = async (datei) => {
    try {
      const objekt = await dateiLesen(datei)
      const ergebnis = await datenImportieren(objekt, 'ersetzen')
      setMeldung(`${ergebnis.eintraege} Tage und ${ergebnis.zyklen} Zyklen wiederhergestellt.`)
    } catch (fehler) {
      setMeldung(fehler.message)
    }
  }

  return (
    <>
      <div className="kopf">
        <h1>Einstellungen</h1>
      </div>

      {meldung && <div className="karte"><div className="hinweis warm">{meldung}</div></div>}

      {/* --- Daten sichern ------------------------------------------------ */}
      <div className="karte">
        <h2>Daten sichern</h2>
        <p className="klein leise">{HINWEISE.export}</p>
        <div className="knopf-reihe abstand-oben">
          <button
            type="button"
            className="knopf betont"
            onClick={async () => {
              await exportHerunterladen()
              setMeldung('Export gespeichert.')
            }}
          >
            Als JSON exportieren
          </button>
          <button type="button" className="knopf" onClick={() => dateiFeld.current?.click()}>
            Sicherung einlesen
          </button>
          <input
            ref={dateiFeld}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const datei = e.target.files?.[0]
              if (datei) importieren(datei)
              e.target.value = ''
            }}
          />
        </div>
        <div className="fussnote">
          {einstellungen.letzterExport
            ? `Letzter Export: ${formatMitJahr(einstellungen.letzterExport.slice(0, 10))}.`
            : 'Noch nie exportiert.'}{' '}
          Gespeichert sind {eintraege.length} Tage und {zyklen.length} Zyklen.
          Einlesen ersetzt die vorhandenen Daten.
        </div>
      </div>

      {/* --- Anzeige ------------------------------------------------------ */}
      <div className="karte">
        <h2>Anzeige</h2>
        <Wippe
          an={einstellungen.hormonelleVerhuetung}
          titel="Hormonelle Verhütung"
          beschreibung="Blendet den typischen Hormonverlauf aus — bei hormoneller Verhütung trifft er nicht zu."
          onChange={(an) => einstellungenSpeichern({ hormonelleVerhuetung: an })}
        />
        <Wippe
          an={einstellungen.favoritenAutomatisch}
          titel="Schnellansicht automatisch"
          beschreibung={`Die ${SCHNELLANSICHT_ANZAHL} meistgetippten Tags stehen oben. Aus: eigene Auswahl.`}
          onChange={(an) => einstellungenSpeichern({ favoritenAutomatisch: an })}
        />
        {!einstellungen.favoritenAutomatisch && (
          <div className="knopf-reihe abstand-oben">
            <button type="button" className="knopf" onClick={() => setFavoritenOffen(true)}>
              Schnellansicht wählen ({(einstellungen.favoritenTags || []).length})
            </button>
          </div>
        )}
        {(einstellungen.weggewischteSprueche || []).length > 0 && (
          <div className="knopf-reihe abstand-oben">
            <button
              type="button"
              className="knopf leise"
              onClick={() => einstellungenSpeichern({ weggewischteSprueche: [] })}
            >
              Weggewischte Sprüche zurückholen ({einstellungen.weggewischteSprueche.length})
            </button>
          </div>
        )}
      </div>

      {/* --- Kategorien --------------------------------------------------- */}
      <div className="karte">
        <h2>Kategorien</h2>
        <p className="klein leise">
          Abgeschaltete Kategorien erscheinen im Tageseintrag nicht mehr. Bereits erfasste
          Daten bleiben erhalten.
        </p>
        {KATEGORIEN.filter((k) => k.abschaltbar).map((k) => (
          <Wippe
            key={k.id}
            an={!versteckt.includes(k.id)}
            titel={k.titel}
            beschreibung={k.hinweis}
            onChange={(an) => kategorieUmschalten(k.id, an)}
          />
        ))}
      </div>

      {/* --- Medikamente -------------------------------------------------- */}
      <div className="karte">
        <div className="zeile-verteilt">
          <h2>Medikamente</h2>
          <button type="button" className="knopf leise" onClick={() => setMedikamenteOffen(true)}>
            bearbeiten
          </button>
        </div>
        <p className="klein leise">
          Einmal angelegt, danach im Tageseintrag ganz normale Chips.
        </p>
        <div className="chips abstand-oben">
          {(einstellungen.eigeneMedikamente || []).map((m) => (
            <span key={m.id} className="chip klein" aria-pressed="false">
              <span className="icon">💊</span>
              {m.name}
              {m.dosis ? ` ${m.dosis}` : ''}
            </span>
          ))}
          {!(einstellungen.eigeneMedikamente || []).length && (
            <span className="klein sehr-leise">Noch keine angelegt.</span>
          )}
        </div>
      </div>

      {/* --- Testdaten ---------------------------------------------------- */}
      <div className="karte">
        <h2>Testdaten</h2>
        <p className="klein leise">
          Sechs vollständige Zyklen plus einen laufenden — damit sich Diagramme und
          Wartemodus ansehen lassen, bevor eigene Daten vorliegen.
        </p>
        <div className="knopf-reihe abstand-oben">
          <button
            type="button"
            className="knopf"
            onClick={async () => {
              const e = await testdatenLaden()
              setMeldung(`${e.eintraege} Testtage in ${e.zyklen} Zyklen geladen.`)
            }}
          >
            Testdaten laden
          </button>
          <button
            type="button"
            className="knopf leise"
            onClick={async () => {
              const e = await testdatenEntfernen()
              setMeldung(`${e.eintraege} Testtage entfernt.`)
            }}
          >
            Testdaten entfernen
          </button>
        </div>
        <div className="fussnote">
          Achtung: „Testdaten laden“ ersetzt vorhandene Einträge. Vorher exportieren.
        </div>
      </div>

      {/* --- Über --------------------------------------------------------- */}
      <div className="karte">
        <h2>Über die App</h2>
        <p className="klein leise">{HINWEISE.keineDiagnose}</p>
        <p className="klein leise">
          Alle Daten liegen ausschliesslich auf diesem Gerät (IndexedDB). Kein Server,
          kein Konto, keine Übertragung.
        </p>
        <p className="klein leise">{HINWEISE.eisprungSchaetzung}</p>
        <div className="knopf-reihe abstand-oben">
          <button type="button" className="knopf leise" onClick={() => setLoeschenOffen(true)}>
            Alle Daten löschen
          </button>
        </div>
      </div>

      {medikamenteOffen && (
        <Dialog titel="Medikamente" onSchliessen={() => setMedikamenteOffen(false)}>
          <MedikamenteVerwalten
            medikamente={einstellungen.eigeneMedikamente || []}
            onAendern={(eigeneMedikamente) => einstellungenSpeichern({ eigeneMedikamente })}
          />
        </Dialog>
      )}

      {favoritenOffen && (
        <Dialog titel="Schnellansicht" onSchliessen={() => setFavoritenOffen(false)}>
          <p className="klein leise">
            Bis zu {SCHNELLANSICHT_ANZAHL} Tags stehen im Tageseintrag ganz oben.
          </p>
          <div className="chips">
            {ALLE_TAGS.map(({ key, kategorie, option }) => {
              const gewaehlt = (einstellungen.favoritenTags || []).includes(key)
              return (
                <Chip
                  key={key}
                  option={option}
                  klein
                  farbe={kategorie.farbe}
                  aktiv={gewaehlt}
                  title={kategorie.titel}
                  onClick={() => {
                    const aktuell = einstellungen.favoritenTags || []
                    const neu = gewaehlt
                      ? aktuell.filter((k) => k !== key)
                      : [...aktuell, key].slice(0, SCHNELLANSICHT_ANZAHL)
                    einstellungenSpeichern({ favoritenTags: neu })
                  }}
                />
              )
            })}
          </div>
        </Dialog>
      )}

      {loeschenOffen && (
        <Dialog titel="Alle Daten löschen" onSchliessen={() => setLoeschenOffen(false)}>
          <p className="klein leise">
            Das entfernt alle Tageseinträge und Zyklen von diesem Gerät. Ohne Export ist
            das nicht rückgängig zu machen.
          </p>
          <div className="knopf-reihe">
            <button
              type="button"
              className="knopf betont"
              onClick={async () => {
                await allesLoeschen()
                setLoeschenOffen(false)
                setMeldung('Alle Daten gelöscht.')
              }}
            >
              Endgültig löschen
            </button>
            <button type="button" className="knopf leise" onClick={() => setLoeschenOffen(false)}>
              Abbrechen
            </button>
          </div>
        </Dialog>
      )}
    </>
  )
}

function MedikamenteVerwalten({ medikamente, onAendern }) {
  const [name, setName] = useState('')
  const [dosis, setDosis] = useState('')

  const hinzufuegen = () => {
    if (!name.trim()) return
    onAendern([
      ...medikamente,
      { id: `med-${Date.now().toString(36)}`, name: name.trim(), dosis: dosis.trim() || undefined },
    ])
    setName('')
    setDosis('')
  }

  return (
    <div className="spalte">
      <ul className="liste">
        {medikamente.map((m) => (
          <li key={m.id}>
            <span>
              {m.name}
              {m.dosis && <span className="klein leise"> {m.dosis}</span>}
            </span>
            <button
              type="button"
              className="knopf leise"
              onClick={() => onAendern(medikamente.filter((x) => x.id !== m.id))}
            >
              entfernen
            </button>
          </li>
        ))}
        {!medikamente.length && <li className="klein sehr-leise">Noch nichts angelegt.</li>}
      </ul>

      <input
        type="text"
        value={name}
        placeholder="Name des Präparats"
        onChange={(e) => setName(e.target.value)}
        aria-label="Name des Präparats"
      />
      <input
        type="text"
        value={dosis}
        placeholder="Dosis (optional)"
        onChange={(e) => setDosis(e.target.value)}
        aria-label="Dosis"
      />
      <button type="button" className="knopf betont" onClick={hinzufuegen} disabled={!name.trim()}>
        Hinzufügen
      </button>
      <div className="fussnote">
        Der einzige Ort in der App, an dem getippt wird — danach reicht ein Antippen.
      </div>
    </div>
  )
}
