/**
 * Ring mit der Position im Zyklus. Im Wartemodus bleibt er absichtlich
 * unbestimmt: eine erfundene Phase waere schlicht falsch (Briefing 6.3).
 */

import { PHASEN, REGELN } from '../config/kategorien.js'
import { phaseFuerZyklustag } from '../logik/zyklus.js'

export default function ZyklusRing({ zyklustag, laenge = REGELN.fallbackZykluslaenge, mensTage = 5, unbestimmt = false, groesse = 96 }) {
  const r = groesse / 2 - 7
  const umfang = 2 * Math.PI * r
  const L = Math.max(laenge || REGELN.fallbackZykluslaenge, zyklustag || 1)

  const segmente = []
  if (!unbestimmt) {
    let aktuell = null
    for (let tag = 1; tag <= L; tag++) {
      const phase = phaseFuerZyklustag(tag, L, mensTage)
      if (!aktuell || aktuell.phase !== phase) {
        aktuell = { phase, von: tag, bis: tag }
        segmente.push(aktuell)
      } else {
        aktuell.bis = tag
      }
    }
  }

  const winkel = (tag) => ((tag - 1) / L) * 360 - 90

  return (
    <svg className="ring" width={groesse} height={groesse} viewBox={`0 0 ${groesse} ${groesse}`} role="img" aria-label={unbestimmt ? 'Position im Zyklus unbekannt' : `Zyklustag ${zyklustag}`}>
      <circle cx={groesse / 2} cy={groesse / 2} r={r} fill="none" stroke="currentColor" opacity="0.12" strokeWidth="7" />

      {segmente.map((s) => {
        const anteil = (s.bis - s.von + 1) / L
        return (
          <circle
            key={s.phase + s.von}
            cx={groesse / 2}
            cy={groesse / 2}
            r={r}
            fill="none"
            stroke={PHASEN[s.phase].farbe}
            strokeWidth="7"
            strokeLinecap="butt"
            opacity="0.75"
            strokeDasharray={`${umfang * anteil} ${umfang}`}
            transform={`rotate(${winkel(s.von)} ${groesse / 2} ${groesse / 2})`}
          />
        )
      })}

      {!unbestimmt && zyklustag && (
        <circle
          cx={groesse / 2 + r * Math.cos((winkel(zyklustag) * Math.PI) / 180)}
          cy={groesse / 2 + r * Math.sin((winkel(zyklustag) * Math.PI) / 180)}
          r="5"
          fill="var(--flaeche)"
          stroke="currentColor"
          strokeWidth="2"
        />
      )}

      <text x={groesse / 2} y={groesse / 2 - 1} textAnchor="middle" fontSize="21" fontWeight="600" fill="currentColor">
        {unbestimmt ? '?' : zyklustag}
      </text>
      <text x={groesse / 2} y={groesse / 2 + 13} textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.55">
        {unbestimmt ? 'unklar' : 'Zyklustag'}
      </text>
    </svg>
  )
}
