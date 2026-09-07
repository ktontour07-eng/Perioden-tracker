/**
 * Tags anlegen, umbenennen, ausblenden und loeschen (Einstellungen).
 *
 * Die Wortlisten aendern sich nach den ersten Wochen Nutzung — das muss ohne
 * Codeaenderung gehen. Wichtig dabei: Umbenennen aendert nur das Wort, nie die
 * ID, und „loeschen“ blendet standardmaessig nur aus. Die Auswertung alter
 * Zyklen bleibt dadurch gueltig.
 */

import { useState } from 'react'
import { ICON_AUSWAHL, STANDARD_TAG_ICON, TAG_KATEGORIEN } from '../config/kategorien.js'
import {
  alleOptionen,
  betroffeneTage,
  mitNeuemTag,
  mitUmbenanntemTag,
  mitVerstecktemTag,
  neuerTag,
  ohneEigenenTag,
  ohneUmbenennung,
} from '../logik/tags.js'
import { tagAusEintraegenEntfernen } from '../db/eintraege.js'
import { Chip, Dialog } from './Basis.jsx'

export default function TagsVerwalten({ einstellungen, speichern, eintraege, onMeldung }) {
  const [kategorieId, setKategorieId] = useState(TAG_KATEGORIEN[0].id)
  const [bearbeitet, setBearbeitet] = useState(null)
  const [neuOffen, setNeuOffen] = useState(false)

  const kategorie = TAG_KATEGORIEN.find((k) => k.id === kategorieId)
  const optionen = alleOptionen(kategorie, einstellungen)

  return (
    <div className="spalte">
      <div className="wahlleiste">
        {TAG_KATEGORIEN.map((k) => (
          <button
            key={k.id}
            type="button"
            aria-pressed={k.id === kategorieId}
            onClick={() => setKategorieId(k.id)}
          >
            {k.titel}
          </button>
        ))}
      </div>

      <ul className="liste">
        {optionen.map((o) => (
          <li key={o.key} style={{ opacity: o.versteckt ? 0.5 : 1 }}>
            <button
              type="button"
              style={{ flex: 1, textAlign: 'left' }}
              onClick={() => setBearbeitet(o)}
            >
              <span className="zeile">
                <span aria-hidden="true">{o.icon}</span>
                <span>{o.wort}</span>
                <span className="gruppe-pfeil" aria-hidden="true">›</span>
              </span>
              {beschreibung(o) && <span className="klein sehr-leise">{beschreibung(o)}</span>}
            </button>
            <button
              type="button"
              className="knopf leise"
              onClick={() => speichern(mitVerstecktemTag(einstellungen, o.key, !o.versteckt))}
            >
              {o.versteckt ? 'zeigen' : 'ausblenden'}
            </button>
          </li>
        ))}
      </ul>

      <button type="button" className="knopf betont" onClick={() => setNeuOffen(true)}>
        Neuen Tag in „{kategorie.titel}“ anlegen
      </button>

      <div className="fussnote">
        Ausblenden nimmt einen Tag aus der Eingabe, lässt ihn aber in bereits
        erfassten Tagen stehen — die Auswertung alter Zyklen bleibt damit richtig.
        Umbenennen ändert nur das Wort, nicht die Zuordnung.
      </div>

      {bearbeitet && (
        <Dialog titel={bearbeitet.wort} onSchliessen={() => setBearbeitet(null)}>
          <TagBearbeiten
            option={bearbeitet}
            kategorie={kategorie}
            einstellungen={einstellungen}
            speichern={speichern}
            eintraege={eintraege}
            onMeldung={onMeldung}
            onFertig={() => setBearbeitet(null)}
          />
        </Dialog>
      )}

      {neuOffen && (
        <Dialog titel={`Neuer Tag: ${kategorie.titel}`} onSchliessen={() => setNeuOffen(false)}>
          <TagAnlegen
            vorhandeneIds={optionen.map((o) => o.id)}
            onAnlegen={(tag) => {
              speichern(mitNeuemTag(einstellungen, kategorie.id, tag))
              setNeuOffen(false)
              onMeldung?.(`„${tag.wort}“ angelegt.`)
            }}
          />
        </Dialog>
      )}
    </div>
  )
}

/** Zweite Zeile nur, wenn es etwas zu sagen gibt. */
function beschreibung(o) {
  return [
    o.eigen ? 'selbst angelegt' : null,
    o.umbenannt ? `ursprünglich „${o.originalWort}“` : null,
    o.versteckt ? 'ausgeblendet' : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

function TagBearbeiten({ option, kategorie, einstellungen, speichern, eintraege, onMeldung, onFertig }) {
  const [wort, setWort] = useState(option.wort)
  const [icon, setIcon] = useState(option.icon || STANDARD_TAG_ICON)
  const [loeschen, setLoeschen] = useState(false)
  const betroffen = betroffeneTage(eintraege, kategorie, option.id)

  const uebernehmen = () => {
    if (!wort.trim()) return
    speichern(mitUmbenanntemTag(einstellungen, option.key, { wort: wort.trim(), icon }))
    onFertig()
  }

  return (
    <div className="spalte">
      <div>
        <div className="klein leise abstand-unten">Wort</div>
        <input type="text" value={wort} onChange={(e) => setWort(e.target.value)} aria-label="Wort" />
      </div>

      <div>
        <div className="klein leise abstand-unten">Icon</div>
        <div className="chips">
          {ICON_AUSWAHL.map((i) => (
            <Chip
              key={i}
              option={{ wort: '', icon: i }}
              klein
              farbe={kategorie.farbe}
              aktiv={icon === i}
              onClick={() => setIcon(i)}
            />
          ))}
        </div>
      </div>

      <div className="knopf-reihe">
        <button type="button" className="knopf betont" onClick={uebernehmen} disabled={!wort.trim()}>
          Übernehmen
        </button>
        {option.umbenannt && (
          <button
            type="button"
            className="knopf leise"
            onClick={() => {
              speichern(ohneUmbenennung(einstellungen, option.key))
              onFertig()
            }}
          >
            Original zurückholen
          </button>
        )}
      </div>

      <hr className="trenner" />

      <div className="klein leise">
        {betroffen === 0
          ? 'Dieser Tag ist bisher an keinem Tag eingetragen.'
          : `Eingetragen an ${betroffen} ${betroffen === 1 ? 'Tag' : 'Tagen'}.`}
      </div>

      {!loeschen ? (
        <div className="knopf-reihe">
          <button
            type="button"
            className="knopf"
            onClick={() => {
              speichern(mitVerstecktemTag(einstellungen, option.key, !option.versteckt))
              onFertig()
            }}
          >
            {option.versteckt ? 'Wieder anzeigen' : 'Aus der Eingabe nehmen'}
          </button>
          <button type="button" className="knopf leise" onClick={() => setLoeschen(true)}>
            Endgültig löschen
          </button>
        </div>
      ) : (
        <div className="spalte">
          <div className="hinweis ruhig">
            Endgültig löschen entfernt den Tag
            {betroffen > 0 ? ` auch aus ${betroffen} bereits erfassten ${betroffen === 1 ? 'Tag' : 'Tagen'}` : ''}.
            {betroffen > 0 && ' Die Auswertung zeigt ihn danach nicht mehr — das lässt sich nur über eine Sicherung rückgängig machen.'}
            {!option.eigen && ' Ein Standard-Tag kommt beim „Zurücksetzen“ in den Einstellungen wieder.'}
          </div>
          <div className="knopf-reihe">
            <button
              type="button"
              className="knopf betont"
              onClick={async () => {
                const anzahl = await tagAusEintraegenEntfernen(kategorie.feld, option.id)
                await speichern(
                  option.eigen
                    ? ohneEigenenTag(einstellungen, kategorie.id, option.id)
                    : mitVerstecktemTag(einstellungen, option.key, true),
                )
                onMeldung?.(
                  anzahl
                    ? `„${option.wort}“ gelöscht und aus ${anzahl} ${anzahl === 1 ? 'Tag' : 'Tagen'} entfernt.`
                    : `„${option.wort}“ gelöscht.`,
                )
                onFertig()
              }}
            >
              Ja, endgültig löschen
            </button>
            <button type="button" className="knopf leise" onClick={() => setLoeschen(false)}>
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TagAnlegen({ vorhandeneIds, onAnlegen }) {
  const [wort, setWort] = useState('')
  const [icon, setIcon] = useState(STANDARD_TAG_ICON)

  return (
    <div className="spalte">
      <div>
        <div className="klein leise abstand-unten">Wort</div>
        <input
          type="text"
          value={wort}
          placeholder="z. B. Heisshunger"
          onChange={(e) => setWort(e.target.value)}
          aria-label="Wort des neuen Tags"
        />
      </div>
      <div>
        <div className="klein leise abstand-unten">Icon</div>
        <div className="chips">
          {ICON_AUSWAHL.map((i) => (
            <Chip
              key={i}
              option={{ wort: '', icon: i }}
              klein
              aktiv={icon === i}
              onClick={() => setIcon(i)}
            />
          ))}
        </div>
      </div>
      <button
        type="button"
        className="knopf betont"
        disabled={!wort.trim()}
        onClick={() => onAnlegen(neuerTag(wort, icon, vorhandeneIds))}
      >
        Anlegen
      </button>
      <div className="fussnote">
        Neue Tags erscheinen sofort im Tageseintrag und ab dem nächsten Eintrag auch
        in der Auswertung.
      </div>
    </div>
  )
}
