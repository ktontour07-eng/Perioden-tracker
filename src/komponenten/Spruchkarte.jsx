/**
 * Spruch passend zu Phase UND aktuellen Daten (Briefing 8).
 * Zurueckhaltend im Ton, einzeln wegwischbar.
 */

import { useMemo } from 'react'
import { SPRUECHE } from '../config/texte.js'
import { spruchKontext } from '../logik/auswertung.js'

export default function Spruchkarte({ eintraege, bezugsdatum, phase, weggewischt = [], onWegwischen }) {
  const spruch = useMemo(() => {
    const kontext = spruchKontext(eintraege, bezugsdatum)
    const offen = SPRUECHE.filter((s) => !weggewischt.includes(s.id))

    // Datengetriebene Sprueche haben Vorrang vor rein phasengebundenen.
    const passend = offen.filter((s) => s.wenn && sicher(() => s.wenn(kontext)))
    if (passend.length) return waehle(passend, bezugsdatum)

    const zurPhase = offen.filter((s) => !s.wenn && s.phase === phase)
    if (zurPhase.length) return waehle(zurPhase, bezugsdatum)

    const allgemein = offen.filter((s) => !s.wenn && !s.phase)
    return allgemein.length ? waehle(allgemein, bezugsdatum) : null
  }, [eintraege, bezugsdatum, phase, weggewischt])

  if (!spruch) return null

  return (
    <div className="karte">
      <div className="spruch">
        {spruch.text}
        <button
          type="button"
          className="wegwischen"
          aria-label="Diesen Spruch nicht mehr zeigen"
          onClick={() => onWegwischen(spruch.id)}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

/** Stabil ueber den Tag: derselbe Tag zeigt denselben Spruch. */
function waehle(liste, datum) {
  const summe = [...datum].reduce((s, c) => s + c.charCodeAt(0), 0)
  return liste[summe % liste.length]
}

const sicher = (fn) => {
  try {
    return fn()
  } catch {
    return false
  }
}
