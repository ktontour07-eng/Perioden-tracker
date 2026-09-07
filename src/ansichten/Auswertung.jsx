/**
 * Auswertung. Unter drei auswertbaren Zyklen bleibt alles ausgegraut
 * (Briefing 7.3) — Rauschen darf nicht als Erkenntnis verkauft werden.
 */

import { useMemo, useState } from 'react'
import {
  PHASEN,
  REGELN,
  SCHMERZ_REGIONEN,
  SKALEN_KATEGORIEN,
  TAG_KATEGORIEN,
} from '../config/kategorien.js'
import { HINWEISE } from '../config/texte.js'
import {
  heatmapDaten,
  mittelKurve,
  overlaySerien,
  phasenStatistik,
  schmerzStatistik,
  tagHaeufigkeiten,
} from '../logik/auswertung.js'
import OverlayLinie from '../charts/OverlayLinie.jsx'
import PhasenBalken from '../charts/PhasenBalken.jsx'
import Heatmap from '../charts/Heatmap.jsx'
import TagBalken from '../charts/TagBalken.jsx'

export default function Auswertung({ daten }) {
  const { zyklusDaten: zd, lage, stand } = daten
  const [skalaId, setSkalaId] = useState('stimmung')
  const [modus, setModus] = useState('rueckwaerts')
  const [tagKategorie, setTagKategorie] = useState(TAG_KATEGORIEN[0].id)

  const skala = SKALEN_KATEGORIEN.find((k) => k.id === skalaId) || SKALEN_KATEGORIEN[0]
  const bereich = [
    Math.min(...skala.optionen.map((o) => o.wert)),
    Math.max(...skala.optionen.map((o) => o.wert)),
  ]
  const einheiten = skala.optionen.map((o) => ({ wert: o.wert, kurz: o.wert }))

  const serien = useMemo(() => overlaySerien(zd, skala.feld, modus), [zd, skala, modus])
  const mittel = useMemo(() => mittelKurve(serien, modus), [serien, modus])
  const phasen = useMemo(() => phasenStatistik(zd, skala.feld), [zd, skala])
  const heat = useMemo(() => heatmapDaten(zd, skala.feld), [zd, skala])
  const tags = useMemo(() => tagHaeufigkeiten(zd, tagKategorie), [zd, tagKategorie])
  const schmerzen = useMemo(() => schmerzStatistik(zd), [zd])

  const gesperrt = !lage.genug

  return (
    <>
      <div className="kopf">
        <div>
          <h1>Auswertung</h1>
          <div className="leise klein">
            {lage.nutzbar} auswertbare {lage.nutzbar === 1 ? 'Zyklus' : 'Zyklen'}
          </div>
        </div>
      </div>

      {gesperrt && (
        <div className="karte">
          <div className="hinweis ruhig">{HINWEISE.zuWenigDaten(lage.fehlend)}</div>
          <div className="fussnote">
            Ab {REGELN.minZyklenFuerAuswertung} vollständigen Zyklen werden die Diagramme
            freigeschaltet. Bis dahin sind sie nur zur Ansicht — mit den bisherigen Daten
            gefüllt, aber nicht belastbar.
          </div>
        </div>
      )}

      <div className={gesperrt ? 'ausgegraut' : undefined}>
        <div className="karte">
          <h2>Verlauf über den Zyklus</h2>
          <div className="klein leise abstand-unten">
            Alle Zyklen übereinandergelegt, dahinter die Phasen.
          </div>

          <div className="wahlleiste">
            {SKALEN_KATEGORIEN.map((k) => (
              <button key={k.id} type="button" aria-pressed={k.id === skalaId} onClick={() => setSkalaId(k.id)}>
                {k.titel}
              </button>
            ))}
          </div>
          <div className="wahlleiste">
            <button type="button" aria-pressed={modus === 'rueckwaerts'} onClick={() => setModus('rueckwaerts')}>
              rückwärts ab Periode
            </button>
            <button type="button" aria-pressed={modus === 'prozent'} onClick={() => setModus('prozent')}>
              0–100 %
            </button>
          </div>

          <OverlayLinie
            serien={serien}
            mittel={mittel}
            modus={modus}
            bereich={bereich}
            farbe={skala.farbe}
            medianLaenge={stand.prognose.medianLaenge}
            einheiten={einheiten}
          />
          <div className="fussnote">
            {modus === 'rueckwaerts'
              ? 'Rückwärts ab dem nächsten Periodenstart: die Lutealphase ist relativ konstant, dort werden Muster am schärfsten sichtbar.'
              : 'Auf die Zykluslänge normalisiert — praktisch zum Übereinanderlegen unterschiedlich langer Zyklen.'}
          </div>
        </div>

        <div className="karte">
          <h2>{skala.titel} je Phase</h2>
          <PhasenBalken statistik={phasen} bereich={bereich} einheiten={einheiten} />
        </div>

        <div className="karte">
          <h2>Heatmap</h2>
          <div className="klein leise abstand-unten">{skala.titel} über alle Zyklen.</div>
          <Heatmap daten={heat} bereich={bereich} farbe={skala.farbe} />
        </div>

        <div className="karte">
          <h2>Tags nach Phase</h2>
          <div className="wahlleiste">
            {TAG_KATEGORIEN.map((k) => (
              <button
                key={k.id}
                type="button"
                aria-pressed={k.id === tagKategorie}
                onClick={() => setTagKategorie(k.id)}
              >
                {k.titel}
              </button>
            ))}
          </div>
          <TagBalken auswertung={tags} />
        </div>

        {schmerzen.length > 0 && (
          <div className="karte">
            <h2>Schmerzen nach Region</h2>
            <ul className="liste abstand-oben">
              {schmerzen.map((s) => (
                <li key={s.region}>
                  <span>
                    {SCHMERZ_REGIONEN.find((r) => r.id === s.region)?.wort || s.region}
                    <div className="klein leise">
                      Ø Intensität {s.mittlereIntensitaet} · {s.gesamt} Tage
                    </div>
                  </span>
                  <span className="klein leise" style={{ textAlign: 'right' }}>
                    {['menstruation', 'follikel', 'luteal'].map((p) => (
                      <div key={p}>
                        {PHASEN[p].kurz}: {Math.round(s.anteil[p] ?? 0)} %
                      </div>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="karte flach">
          <div className="klein leise">{HINWEISE.confounder}</div>
          <div className="fussnote">{HINWEISE.keineDiagnose}</div>
        </div>
      </div>
    </>
  )
}
