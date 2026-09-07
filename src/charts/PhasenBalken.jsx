/**
 * Balken je Phase — immer mit Streuung (Briefing 7.2). Box = 25.–75.
 * Perzentil, Strich = Median, Whisker = Spanne.
 */

import { PHASEN } from '../config/kategorien.js'
import { skalieren } from './hilfen.js'

const B = 320
const H = 150
const RAND = { oben: 12, rechts: 10, unten: 30, links: 30 }

export default function PhasenBalken({ statistik, bereich = [1, 5], einheiten = [] }) {
  const gezeigt = statistik.filter((s) => s.n > 0)
  if (!gezeigt.length) return <div className="hinweis">Für diese Skala liegen noch keine Werte vor.</div>

  const breite = (B - RAND.links - RAND.rechts) / gezeigt.length
  const py = (y) => skalieren(y, bereich, [H - RAND.unten, RAND.oben])

  return (
    <div className="diagramm">
      <svg viewBox={`0 0 ${B} ${H}`} role="img" aria-label="Durchschnitt je Phase mit Streuung">
        {einheiten.map((e) => (
          <g key={e.wert}>
            <line x1={RAND.links} x2={B - RAND.rechts} y1={py(e.wert)} y2={py(e.wert)} stroke="currentColor" opacity="0.1" />
            <text x={4} y={py(e.wert) + 3} fontSize="7" fill="currentColor" opacity="0.5">{e.kurz}</text>
          </g>
        ))}

        {gezeigt.map((s, i) => {
          const mitte = RAND.links + breite * (i + 0.5)
          const bb = Math.min(38, breite * 0.5)
          const farbe = PHASEN[s.phase].farbe
          return (
            <g key={s.phase}>
              {/* Spanne */}
              <line x1={mitte} x2={mitte} y1={py(s.max)} y2={py(s.min)} stroke={farbe} strokeWidth="1" opacity="0.5" />
              <line x1={mitte - 5} x2={mitte + 5} y1={py(s.max)} y2={py(s.max)} stroke={farbe} strokeWidth="1" opacity="0.5" />
              <line x1={mitte - 5} x2={mitte + 5} y1={py(s.min)} y2={py(s.min)} stroke={farbe} strokeWidth="1" opacity="0.5" />
              {/* Quartilsbox */}
              <rect
                x={mitte - bb / 2}
                y={py(s.p75)}
                width={bb}
                height={Math.max(2, py(s.p25) - py(s.p75))}
                rx="3"
                fill={farbe}
                opacity="0.28"
              />
              {/* Median */}
              <line
                x1={mitte - bb / 2}
                x2={mitte + bb / 2}
                y1={py(s.median)}
                y2={py(s.median)}
                stroke={farbe}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <text x={mitte} y={H - 16} fontSize="7.5" textAnchor="middle" fill="currentColor" opacity="0.7">
                {PHASEN[s.phase].kurz}
              </text>
              <text x={mitte} y={H - 6} fontSize="6.5" textAnchor="middle" fill="currentColor" opacity="0.45">
                {s.n} Tage
              </text>
            </g>
          )
        })}
      </svg>
      <div className="fussnote">
        Strich = Median, Box = mittlere Hälfte der Tage, Linie = Spanne. Die Streuung
        steht dabei, damit der Balken keine Genauigkeit vortäuscht.
      </div>
    </div>
  )
}
