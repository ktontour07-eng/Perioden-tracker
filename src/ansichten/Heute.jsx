/**
 * Heute-Bildschirm: Zyklusstand oben, darunter der Tageseintrag.
 * Im Wartemodus verschwinden Phase, Eisprung und Hormonverlauf — in einem
 * unklaren Zyklus ist die Position unbekannt (Briefing 6.3).
 */

import { useEffect, useRef, useState } from 'react'
import { PHASEN } from '../config/kategorien.js'
import { HINWEISE, PHASEN_INFO, PHASEN_TIPPS, UEBERFAELLIG_ANTWORTEN } from '../config/texte.js'
import { formatKurz, formatLang, formatWochentag, heute as heuteISO, plusTage, tageDazwischen } from '../logik/datum.js'
import { istBefuellt } from '../logik/auswertung.js'
import { zyklusAktualisieren } from '../db/eintraege.js'
import { useTag } from '../daten/useTag.js'
import Tageseintrag from '../komponenten/Tageseintrag.jsx'
import Spruchkarte from '../komponenten/Spruchkarte.jsx'
import ZyklusRing from '../charts/ZyklusRing.jsx'
import Hormonkurve from '../charts/Hormonkurve.jsx'
import { Aufklappbar, Dialog } from '../komponenten/Basis.jsx'

export default function Heute({ daten, aufDatum, datum, gehZu }) {
  const { stand, einstellungen, einstellungenSpeichern, eintraege, arzt } = daten
  const { eintrag, aendern } = useTag(datum)
  const [dialogOffen, setDialogOffen] = useState(false)
  const [infoOffen, setInfoOffen] = useState(false)

  const phase = PHASEN[stand.phase] || PHASEN.unbekannt
  const info = PHASEN_INFO[stand.phase] || PHASEN_INFO.unbekannt
  const tipps = PHASEN_TIPPS[stand.phase] || []
  const heuteIst = datum === heuteISO()

  const antwortWaehlen = async (id) => {
    const zyklus = stand.zyklus
    setDialogOffen(false)
    if (!zyklus) return
    if (id === 'nachtragen') {
      gehZu('zyklen', 'nachtragen')
      return
    }
    await zyklusAktualisieren(zyklus.id, {
      status: id === 'nicht-gekommen' ? 'ausgeblieben' : 'unklar',
      statusManuell: true,
      inStatistik: false,
      inStatistikManuell: true,
    })
  }

  return (
    <>
      <div className="kopf">
        <div>
          <h1>{heuteIst ? 'Heute' : formatWochentag(datum)}</h1>
          <div className="leise klein">{formatLang(datum)}</div>
        </div>
        {!heuteIst && (
          <button type="button" className="knopf leise" onClick={() => aufDatum(heuteISO())}>
            zu heute
          </button>
        )}
      </div>

      <Datumsleiste datum={datum} aufDatum={aufDatum} eintraege={eintraege} />

      {/* Zyklusstand */}
      <div className="karte">
        <div className="zyklus-kopf">
          <ZyklusRing
            zyklustag={stand.zyklustag}
            laenge={stand.prognose.medianLaenge}
            mensTage={stand.zyklus?.mensTage || 5}
            unbestimmt={stand.wartemodus || stand.keineDaten}
          />
          <div style={{ flex: 1 }}>
            {stand.keineDaten ? (
              <>
                <div className="titel">Noch kein Zyklus</div>
                <div className="leise klein">
                  Trag den ersten Tag deiner Blutung ein — daraus entsteht der erste Zyklus.
                </div>
              </>
            ) : (
              <>
                <div className="titel">Zyklustag {stand.zyklustag}</div>
                <div className="abstand-unten">
                  <span
                    className="phase-marke"
                    style={{ '--phase-farbe': phase.farbe, '--phase-hell': phase.hell }}
                  >
                    {stand.wartemodus ? 'Position unklar' : phase.titel}
                  </span>
                </div>
                {stand.wartemodus ? (
                  <div className="leise klein">
                    Periode überfällig seit {stand.ueberfaelligTage}{' '}
                    {stand.ueberfaelligTage === 1 ? 'Tag' : 'Tagen'}.
                  </div>
                ) : (
                  <div className="leise klein">
                    Nächste Periode {formatKurz(stand.prognose.fensterVon)}–
                    {formatKurz(stand.prognose.fensterBis)}
                    {stand.prognose.anzahlBasis > 0
                      ? ` · Median ${stand.prognose.medianLaenge} Tage`
                      : ' · noch geschätzt'}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {stand.wartemodus && (
          <div className="hinweis ruhig abstand-oben">
            {HINWEISE.ueberfaellig()}
            <div className="knopf-reihe" style={{ marginTop: 10 }}>
              <button type="button" className="knopf" onClick={() => setDialogOffen(true)}>
                Das trifft zu …
              </button>
            </div>
            <div className="fussnote">{HINWEISE.wartemodus}</div>
          </div>
        )}

        {!stand.wartemodus && !stand.keineDaten && stand.prognose.anzahlBasis > 0 && (
          <div className="fussnote">
            {HINWEISE.prognoseFenster} Grundlage: {stand.prognose.anzahlBasis}{' '}
            {stand.prognose.anzahlBasis === 1 ? 'Zyklus' : 'Zyklen'} ({stand.prognose.kuerzeste}–
            {stand.prognose.laengste} Tage).
          </div>
        )}
      </div>

      {arzt.noetig && !einstellungen.arztHinweisGesehen && (
        <div className="karte">
          <div className="hinweis ruhig">
            {HINWEISE.arzt}
            <div className="knopf-reihe" style={{ marginTop: 10 }}>
              <button
                type="button"
                className="knopf leise"
                onClick={() => einstellungenSpeichern({ arztHinweisGesehen: true })}
              >
                verstanden
              </button>
            </div>
          </div>
        </div>
      )}

      <Spruchkarte
        eintraege={eintraege}
        bezugsdatum={datum}
        phase={stand.phase}
        weggewischt={einstellungen.weggewischteSprueche}
        onWegwischen={(id) =>
          einstellungenSpeichern({
            weggewischteSprueche: [...(einstellungen.weggewischteSprueche || []), id],
          })
        }
      />

      <Tageseintrag
        eintrag={eintrag}
        aendern={aendern}
        einstellungen={einstellungen}
        schnellTags={daten.schnellTags}
      />

      {/* Phaseninfo und Tipps */}
      <div className="karte">
        <Aufklappbar
          titel={info.titel}
          farbe={phase.farbe}
          offen={infoOffen}
          onUmschalten={() => setInfoOffen((o) => !o)}
          zusammenfassung={infoOffen ? '' : 'Info & Tipps'}
        >
          <p className="klein leise">{info.text}</p>
          {tipps.length > 0 && (
            <ul className="liste abstand-oben">
              {tipps.map((t) => (
                <li key={t} className="klein" style={{ display: 'block' }}>
                  {t}
                </li>
              ))}
            </ul>
          )}
          <div className="fussnote">Vorschläge, keine Anweisungen.</div>
        </Aufklappbar>
      </div>

      {/* Hormonverlauf: bei hormoneller Verhuetung und im Wartemodus ausgeblendet */}
      {!einstellungen.hormonelleVerhuetung && !stand.wartemodus && !stand.keineDaten && (
        <div className="karte">
          <h2>Typischer Hormonverlauf</h2>
          <Hormonkurve laenge={stand.prognose.medianLaenge} zyklustag={stand.zyklustag} />
        </div>
      )}
      {einstellungen.hormonelleVerhuetung && (
        <div className="karte flach">
          <div className="klein leise">{HINWEISE.hormondiagrammVerhuetung}</div>
        </div>
      )}

      {dialogOffen && (
        <Dialog titel="Periode überfällig" onSchliessen={() => setDialogOffen(false)}>
          <p className="klein leise">
            Verspätungen sind häufig. Was davon trifft zu?
          </p>
          <div className="spalte">
            {UEBERFAELLIG_ANTWORTEN.map((a) => (
              <button
                key={a.id}
                type="button"
                className="knopf voll"
                style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '12px 14px' }}
                onClick={() => antwortWaehlen(a.id)}
              >
                <span>{a.wort}</span>
                <span className="klein leise" style={{ fontWeight: 400 }}>{a.beschreibung}</span>
              </button>
            ))}
          </div>
        </Dialog>
      )}
    </>
  )
}

/** Die letzten Tage zum Nachtragen — ohne Streak, ohne Mahnung. */
function Datumsleiste({ datum, aufDatum, eintraege }) {
  const leiste = useRef(null)
  const tage = []
  for (let i = 13; i >= 0; i--) tage.push(plusTage(heuteISO(), -i))
  const nachDatum = new Map(eintraege.map((e) => [e.date, e]))

  // Heute ist der rechte Rand — dorthin springen, statt zwei Wochen zurueckzuzeigen.
  useEffect(() => {
    if (leiste.current) leiste.current.scrollLeft = leiste.current.scrollWidth
  }, [])

  return (
    <div className="datumsleiste" ref={leiste}>
      {tage.map((t) => {
        const e = nachDatum.get(t)
        const gefuellt = istBefuellt(e)
        const blutung = (e?.blutung || 0) > 0
        return (
          <button
            key={t}
            type="button"
            aria-current={t === datum ? 'date' : undefined}
            onClick={() => aufDatum(t)}
          >
            {formatWochentag(t)}
            <span className="tag">{Number(t.slice(8))}</span>
            <span
              className="punkt"
              style={{ '--punkt': blutung ? 'var(--mens)' : gefuellt ? 'var(--foll)' : 'transparent' }}
            />
          </button>
        )
      })}
    </div>
  )
}
