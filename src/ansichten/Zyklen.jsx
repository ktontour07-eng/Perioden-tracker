/**
 * Historie und Statusverwaltung. Ausgebliebene und unklare Zyklen bleiben
 * sichtbar — sie sind die wichtigste Information — fliessen aber nur dann in
 * Median und Prognose ein, wenn sie ausdruecklich freigegeben werden
 * (Briefing 3.1).
 */

import { useEffect, useState } from 'react'
import { REGELN, ZYKLUS_STATUS } from '../config/kategorien.js'
import { formatMitJahr, heute as heuteISO, plusTage } from '../logik/datum.js'
import { musterUeberZeit } from '../logik/auswertung.js'
import { zyklusAktualisieren, zyklusAnlegen, zyklusLoeschen } from '../db/eintraege.js'
import { Dialog, Wippe } from '../komponenten/Basis.jsx'

export default function Zyklen({ daten, gehZu, aktion, aktionErledigt }) {
  const { zyklen, bezugsdatum } = daten
  const [offenerZyklus, setOffenerZyklus] = useState(null)
  const [nachtragen, setNachtragen] = useState(false)
  const [neuesDatum, setNeuesDatum] = useState(heuteISO())

  useEffect(() => {
    if (aktion === 'nachtragen') {
      setNachtragen(true)
      aktionErledigt?.()
    }
  }, [aktion, aktionErledigt])

  const muster = musterUeberZeit(zyklen, bezugsdatum)
  const umgekehrt = [...zyklen].reverse()
  const offen = zyklen.find((z) => z.id === offenerZyklus) || null

  return (
    <>
      <div className="kopf">
        <h1>Zyklen</h1>
        <button type="button" className="knopf leise" onClick={() => setNachtragen(true)}>
          Periode nachtragen
        </button>
      </div>

      <div className="karte">
        <h2>Muster über die Zeit</h2>
        <ul className="liste abstand-oben">
          <li>
            <span className="leise">Zyklen erfasst</span>
            <span>{muster.gesamt}</span>
          </li>
          <li>
            <span className="leise">Median der Länge</span>
            <span>{muster.medianLaenge ? `${muster.medianLaenge} Tage` : '–'}</span>
          </li>
          <li>
            <span className="leise">Spanne</span>
            <span>{muster.kuerzeste ? `${muster.kuerzeste}–${muster.laengste} Tage` : '–'}</span>
          </li>
          <li>
            <span className="leise">Streuung</span>
            <span>{muster.streuung !== null ? `± ${muster.streuung} Tage` : '–'}</span>
          </li>
          <li>
            <span className="leise">Ausgeblieben (letztes Jahr)</span>
            <span>{muster.ausgebliebenLetztesJahr}</span>
          </li>
          <li>
            <span className="leise">Unklar (letztes Jahr)</span>
            <span>{muster.unklarLetztesJahr}</span>
          </li>
        </ul>
        {muster.streuungFrueh !== null && muster.streuungSpaet !== null && (
          <div className="fussnote">
            Streuung früher ± {muster.streuungFrueh} Tage, zuletzt ± {muster.streuungSpaet} Tage.
            {muster.streuungSpaet > muster.streuungFrueh
              ? ' Die Zyklen schwanken zuletzt stärker.'
              : ' Die Zyklen sind zuletzt gleichmässiger.'}
          </div>
        )}
        <div className="knopf-reihe abstand-oben">
          <button type="button" className="knopf" onClick={() => gehZu('bericht')}>
            Übersicht fürs Arztgespräch
          </button>
        </div>
      </div>

      <div className="karte">
        <h2>Historie</h2>
        {!umgekehrt.length && (
          <div className="hinweis abstand-oben">
            Noch keine Zyklen. Sobald du einen Blutungstag einträgst, entsteht der erste.
          </div>
        )}
        <ul className="liste abstand-oben">
          {umgekehrt.map((z) => (
            <li key={z.id}>
              <button
                type="button"
                style={{ flex: 1, textAlign: 'left' }}
                onClick={() => setOffenerZyklus(z.id)}
              >
                <div>{formatMitJahr(z.startDate)}</div>
                <div className="klein leise">
                  {z.laufend
                    ? `läuft — Tag ${z.bisherigeTage}`
                    : `${z.laenge} Tage${z.mensTage ? ` · ${z.mensTage} Tage Blutung` : ''}`}
                  {!z.laufend && !z.inStatistik && ' · nicht in der Statistik'}
                </div>
              </button>
              <span className={`marke ${z.status}`}>
                {ZYKLUS_STATUS[z.status]?.wort || z.status}
              </span>
            </li>
          ))}
        </ul>
        <div className="fussnote">
          Länge = Abstand zum nächsten Periodenstart. Ein Zyklus ohne Blutung dazwischen
          würde den Median verzerren — deshalb zählen nur freigegebene Zyklen mit.
        </div>
      </div>

      {offen && (
        <Dialog titel={formatMitJahr(offen.startDate)} onSchliessen={() => setOffenerZyklus(null)}>
          <ZyklusBearbeiten
            zyklus={offen}
            onFertig={() => setOffenerZyklus(null)}
          />
        </Dialog>
      )}

      {nachtragen && (
        <Dialog titel="Periode nachtragen" onSchliessen={() => setNachtragen(false)}>
          <p className="klein leise">
            Erster Tag der Blutung. Der Zyklus wird angelegt, auch wenn für diesen Tag
            kein Eintrag existiert.
          </p>
          <input
            type="date"
            value={neuesDatum}
            max={heuteISO()}
            onChange={(e) => setNeuesDatum(e.target.value)}
            aria-label="Erster Tag der Blutung"
          />
          <div className="knopf-reihe abstand-oben">
            <button
              type="button"
              className="knopf betont"
              onClick={async () => {
                await zyklusAnlegen(neuesDatum)
                setNachtragen(false)
              }}
            >
              Zyklus anlegen
            </button>
            <button type="button" className="knopf leise" onClick={() => setNachtragen(false)}>
              Abbrechen
            </button>
          </div>
        </Dialog>
      )}
    </>
  )
}

function ZyklusBearbeiten({ zyklus, onFertig }) {
  const [loeschen, setLoeschen] = useState(false)

  const statusSetzen = (status) =>
    zyklusAktualisieren(zyklus.id, {
      status,
      statusManuell: true,
      inStatistik: ZYKLUS_STATUS[status].inStatistik,
      inStatistikManuell: false,
    })

  return (
    <div className="spalte">
      <div className="klein leise">
        {zyklus.laufend
          ? `Läuft seit ${zyklus.bisherigeTage} Tagen.`
          : `${zyklus.laenge} Tage bis zum nächsten Periodenstart.`}
      </div>

      <div>
        <div className="klein leise abstand-unten">Status</div>
        <div className="wahlleiste">
          {Object.values(ZYKLUS_STATUS).map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={zyklus.status === s.id}
              onClick={() => statusSetzen(s.id)}
            >
              {s.wort}
            </button>
          ))}
        </div>
        {!zyklus.statusManuell && !zyklus.laufend && (
          <div className="fussnote">
            Automatisch aus der Länge abgeleitet ({REGELN.minNormal}–{REGELN.maxNormal} Tage =
            normal, bis {REGELN.maxLang} = lang, darüber = ausgeblieben).
          </div>
        )}
      </div>

      <Wippe
        an={zyklus.inStatistik}
        titel="Fliesst in Median und Prognose ein"
        beschreibung="Ausgebliebene oder unklare Zyklen bleiben in der Historie, verzerren so aber keine Vorhersage."
        onChange={(an) =>
          zyklusAktualisieren(zyklus.id, { inStatistik: an, inStatistikManuell: true })
        }
      />

      <div>
        <div className="klein leise abstand-unten">Erster Tag der Blutung</div>
        <input
          type="date"
          value={zyklus.startDate}
          max={heuteISO()}
          onChange={(e) =>
            e.target.value && zyklusAktualisieren(zyklus.id, { startDate: e.target.value, manuell: true })
          }
        />
      </div>

      <div>
        <div className="klein leise abstand-unten">Letzter Tag der Blutung</div>
        <input
          type="date"
          value={zyklus.endDate || ''}
          min={zyklus.startDate}
          max={plusTage(zyklus.startDate, 14)}
          onChange={(e) =>
            zyklusAktualisieren(zyklus.id, { endDate: e.target.value || null, endeManuell: true })
          }
        />
      </div>

      <hr className="trenner" />

      {loeschen ? (
        <div className="knopf-reihe">
          <button
            type="button"
            className="knopf betont"
            onClick={async () => {
              await zyklusLoeschen(zyklus.id)
              onFertig()
            }}
          >
            Wirklich löschen
          </button>
          <button type="button" className="knopf leise" onClick={() => setLoeschen(false)}>
            Abbrechen
          </button>
        </div>
      ) : (
        <button type="button" className="knopf leise" onClick={() => setLoeschen(true)}>
          Zyklus löschen
        </button>
      )}
      <div className="fussnote">
        Die Tageseinträge bleiben erhalten — gelöscht wird nur die Zyklusgrenze.
      </div>
    </div>
  )
}
