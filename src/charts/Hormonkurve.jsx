/**
 * Idealisierter Hormonverlauf. Ausdruecklich beschriftet als „typischer
 * Verlauf“ — es sind keine gemessenen eigenen Werte (Briefing 7.4).
 */

import { HORMONE, hormonVerlauf } from '../logik/hormone.js'
import { PHASEN, REGELN } from '../config/kategorien.js'
import { HINWEISE } from '../config/texte.js'
import { skalieren, weicherPfad } from './hilfen.js'

const B = 320
const H = 140
const RAND = { oben: 16, rechts: 8, unten: 22, links: 8 }

export default function Hormonkurve({ laenge = REGELN.fallbackZykluslaenge, zyklustag = null }) {
  const punkte = hormonVerlauf(laenge)
  const L = punkte.length
  const px = (tag) => skalieren(tag, [1, L], [RAND.links, B - RAND.rechts])
  const py = (wert) => skalieren(wert, [0, 1], [H - RAND.unten, RAND.oben])
  const eisprung = L - REGELN.lutealTage

  return (
    <div className="diagramm">
      <svg viewBox={`0 0 ${B} ${H}`} role="img" aria-label="Typischer Hormonverlauf">
        <rect x={px(1)} y={RAND.oben} width={px(5) - px(1)} height={H - RAND.unten - RAND.oben} fill={PHASEN.menstruation.farbe} opacity="0.1" />
        <rect x={px(eisprung)} y={RAND.oben} width={px(L) - px(eisprung)} height={H - RAND.unten - RAND.oben} fill={PHASEN.luteal.farbe} opacity="0.08" />
        <line x1={px(eisprung)} x2={px(eisprung)} y1={RAND.oben} y2={H - RAND.unten} stroke={PHASEN.eisprung.farbe} strokeWidth="1" strokeDasharray="3 3" />
        <text x={px(eisprung)} y={10} fontSize="7" textAnchor="middle" fill={PHASEN.eisprung.farbe}>
          Eisprung (geschätzt)
        </text>

        {HORMONE.map((h) => (
          <path
            key={h.id}
            d={weicherPfad(punkte.map((p) => ({ x: px(p.tag), y: py(p[h.id]) })))}
            fill="none"
            stroke={h.farbe}
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.9"
          />
        ))}

        {zyklustag && zyklustag <= L && (
          <>
            <line x1={px(zyklustag)} x2={px(zyklustag)} y1={RAND.oben - 4} y2={H - RAND.unten} stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
            <circle cx={px(zyklustag)} cy={RAND.oben - 6} r="2.4" fill="currentColor" opacity="0.6" />
          </>
        )}

        <text x={px(1)} y={H - 8} fontSize="7" fill="currentColor" opacity="0.5">Tag 1</text>
        <text x={px(L)} y={H - 8} fontSize="7" textAnchor="end" fill="currentColor" opacity="0.5">Tag {L}</text>
      </svg>

      <div className="legende">
        {HORMONE.map((h) => (
          <span key={h.id}>
            <i style={{ background: h.farbe }} />
            {h.wort}
          </span>
        ))}
      </div>
      <div className="fussnote"><strong>Typischer Verlauf.</strong> {HINWEISE.hormondiagramm}</div>
    </div>
  )
}
