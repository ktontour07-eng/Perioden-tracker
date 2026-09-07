/**
 * Overlay: alle Zyklen uebereinandergelegt, dahinter die Phasenbaender
 * (Briefing 7.2). Zwei Achsen zur Wahl — 0–100 % oder rueckwaerts ab dem
 * naechsten Periodenstart.
 */

import { PHASEN, REGELN } from '../config/kategorien.js'
import { skalieren, weicherPfad } from './hilfen.js'

const B = 320
const H = 170
const RAND = { oben: 12, rechts: 10, unten: 24, links: 26 }

export default function OverlayLinie({
  serien,
  mittel = [],
  modus = 'prozent',
  bereich = [1, 5],
  farbe = '#8b7ea8',
  medianLaenge = REGELN.fallbackZykluslaenge,
  einheiten = [],
}) {
  const xBereich = modus === 'rueckwaerts' ? [-(medianLaenge - 1), -1] : [0, 100]
  const px = (x) => skalieren(x, xBereich, [RAND.links, B - RAND.rechts])
  const py = (y) => skalieren(y, bereich, [H - RAND.unten, RAND.oben])

  const baender = phasenBaender(modus, medianLaenge)

  return (
    <div className="diagramm">
      <svg viewBox={`0 0 ${B} ${H}`} role="img" aria-label="Verlauf über alle Zyklen">
        {baender.map((b) => (
          <rect
            key={b.phase}
            x={px(b.von)}
            y={RAND.oben}
            width={Math.max(0, px(b.bis) - px(b.von))}
            height={H - RAND.unten - RAND.oben}
            fill={PHASEN[b.phase].farbe}
            opacity="0.1"
          />
        ))}

        {/* Achsen */}
        {einheiten.map((e) => (
          <g key={e.wert}>
            <line
              x1={RAND.links}
              x2={B - RAND.rechts}
              y1={py(e.wert)}
              y2={py(e.wert)}
              stroke="currentColor"
              opacity="0.1"
            />
            <text x={2} y={py(e.wert) + 3} fontSize="7" fill="currentColor" opacity="0.5">
              {e.kurz}
            </text>
          </g>
        ))}

        {/* einzelne Zyklen */}
        {serien.map((s) => (
          <path
            key={s.id}
            d={weicherPfad(s.punkte.map((p) => ({ x: px(p.x), y: py(p.y) })))}
            fill="none"
            stroke={farbe}
            strokeWidth="1"
            opacity="0.28"
            strokeLinecap="round"
          />
        ))}

        {/* Mittelwertkurve */}
        {mittel.length > 1 && (
          <path
            d={weicherPfad(mittel.map((p) => ({ x: px(p.x), y: py(p.y) })))}
            fill="none"
            stroke={farbe}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        )}

        {/* x-Beschriftung */}
        {xBeschriftung(modus, medianLaenge).map((t) => (
          <text key={t.x} x={px(t.x)} y={H - 8} fontSize="7.5" textAnchor="middle" fill="currentColor" opacity="0.55">
            {t.wort}
          </text>
        ))}
      </svg>

      <div className="legende">
        {baender.map((b) => (
          <span key={b.phase}>
            <i style={{ background: PHASEN[b.phase].farbe, opacity: 0.35 }} />
            {PHASEN[b.phase].titel}
          </span>
        ))}
        <span>
          <i style={{ background: farbe }} />
          Mittel über alle Zyklen
        </span>
      </div>
    </div>
  )
}

function phasenBaender(modus, laenge) {
  const mens = 5
  const eisprung = laenge - REGELN.lutealTage
  if (modus === 'rueckwaerts') {
    return [
      { phase: 'menstruation', von: -(laenge - 1), bis: -(laenge - mens) },
      { phase: 'follikel', von: -(laenge - mens), bis: -REGELN.lutealTage - 1 },
      { phase: 'luteal', von: -REGELN.lutealTage - 1, bis: -1 },
    ]
  }
  const p = (tag) => ((tag - 1) / (laenge - 1)) * 100
  return [
    { phase: 'menstruation', von: 0, bis: p(mens) },
    { phase: 'follikel', von: p(mens), bis: p(eisprung) },
    { phase: 'luteal', von: p(eisprung), bis: 100 },
  ]
}

function xBeschriftung(modus, laenge) {
  if (modus === 'rueckwaerts') {
    return [
      { x: -(laenge - 1), wort: `−${laenge - 1}` },
      { x: -21, wort: '−21' },
      { x: -14, wort: '−14' },
      { x: -7, wort: '−7' },
      { x: -1, wort: '−1' },
    ].filter((t) => t.x >= -(laenge - 1))
  }
  return [
    { x: 0, wort: 'Start' },
    { x: 50, wort: '50 %' },
    { x: 100, wort: 'nächste Periode' },
  ]
}
