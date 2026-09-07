/**
 * Tag-Haeufigkeiten je Phase in Prozent der Tage dieser Phase (Briefing 7.2).
 * „reizbar an 68 % der Lutealtage vs. 12 % follikulaer.“
 */

import { PHASEN } from '../config/kategorien.js'

const PHASEN_LISTE = ['menstruation', 'follikel', 'luteal']

export default function TagBalken({ auswertung }) {
  const { zeilen, nenner } = auswertung
  if (!zeilen?.length) return <div className="hinweis">In dieser Kategorie wurde noch nichts getippt.</div>

  return (
    <div>
      {zeilen.map((z) => (
        <div key={z.key} style={{ marginBottom: 14 }}>
          <div className="zeile-verteilt" style={{ marginBottom: 5 }}>
            <span className="zeile">
              <span aria-hidden="true">{z.option.icon}</span>
              <strong style={{ fontWeight: 500, fontSize: '0.9rem' }}>{z.option.wort}</strong>
            </span>
            {z.unterschied !== null && Math.abs(z.unterschied) >= 10 && (
              <span className="klein sehr-leise">
                {z.unterschied > 0 ? '+' : '−'}{Math.abs(Math.round(z.unterschied))} % luteal
              </span>
            )}
          </div>
          {PHASEN_LISTE.map((p) => (
            <div className="balkenzeile" key={p}>
              <span className="leise klein">{PHASEN[p].kurz}</span>
              <span className="balkenspur">
                <span
                  className="balken"
                  style={{
                    width: `${Math.max(0, Math.min(100, z.werte[p] ?? 0))}%`,
                    background: PHASEN[p].farbe,
                  }}
                />
              </span>
              <span className="wert klein">{z.werte[p] === null ? '–' : `${Math.round(z.werte[p])} %`}</span>
            </div>
          ))}
        </div>
      ))}
      <div className="fussnote">
        Prozent der Tage mit Eintrag in der jeweiligen Phase
        {nenner && ` (${nenner.menstruation} · ${nenner.follikel} · ${nenner.luteal} Tage)`}.
        Tage ohne Eintrag zählen nicht als „nicht gehabt“.
      </div>
    </div>
  )
}
