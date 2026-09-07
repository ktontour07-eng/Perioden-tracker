/**
 * Heatmap: Zeilen = Zyklen, Spalten = Zyklustage (Briefing 7.2).
 * Ab vier bis fünf Zyklen das beste Werkzeug zum Mustererkennen.
 */

import { farbeZwischen } from './hilfen.js'
import { formatKurz } from '../logik/datum.js'

export default function Heatmap({ daten, bereich = [1, 5], farbe = '#8b7ea8', leer = '#e8e5e2' }) {
  const { maxTage, zeilen } = daten
  if (!zeilen.length || !maxTage) return <div className="hinweis">Noch keine Zyklen zum Vergleichen.</div>

  const zelle = 9
  const beschriftung = 34
  const breite = beschriftung + maxTage * zelle
  const hoehe = zeilen.length * zelle + 16

  return (
    <div className="diagramm">
      <svg viewBox={`0 0 ${breite} ${hoehe}`} width={Math.max(breite, 320)} role="img" aria-label="Heatmap über alle Zyklen">
        {zeilen.map((z, zi) => (
          <g key={z.id}>
            <text x={0} y={zi * zelle + 8} fontSize="6.5" fill="currentColor" opacity="0.6">
              {formatKurz(z.start)}
            </text>
            {z.werte.map((w, ti) => (
              <rect
                key={ti}
                x={beschriftung + ti * zelle}
                y={zi * zelle + 1}
                width={zelle - 1.2}
                height={zelle - 1.2}
                rx="1.6"
                fill={
                  w
                    ? farbeZwischen('#f3efec', farbe, (w.wert - bereich[0]) / (bereich[1] - bereich[0]))
                    : ti < z.laenge
                      ? leer
                      : 'transparent'
                }
                opacity={w ? 1 : ti < z.laenge ? 0.35 : 0}
              >
                <title>{w ? `${w.datum}: ${w.wert}` : ''}</title>
              </rect>
            ))}
          </g>
        ))}
        {[1, 7, 14, 21, 28, 35].filter((t) => t <= maxTage).map((t) => (
          <text
            key={t}
            x={beschriftung + (t - 1) * zelle + zelle / 2}
            y={hoehe - 3}
            fontSize="6"
            textAnchor="middle"
            fill="currentColor"
            opacity="0.5"
          >
            {t}
          </text>
        ))}
      </svg>
      <div className="fussnote">
        Eine Zeile je Zyklus, eine Spalte je Zyklustag. Blasse Felder sind Tage ohne Eintrag.
      </div>
    </div>
  )
}
