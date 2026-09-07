/**
 * Sexleben getrennt nach Aktivitaet, Verhuetung und Libido (Briefing 5).
 * Nur Libido geht in die Zyklusauswertung ein; der Rest ist Protokoll.
 * Die ganze Kategorie laesst sich in den Einstellungen ausblenden.
 */

import { SEX_AKTIVITAET, SEX_LIBIDO, SEX_VERHUETUNG } from '../config/kategorien.js'
import { Chip } from './Basis.jsx'

export function sexText(sex = {}) {
  const teile = []
  const a = SEX_AKTIVITAET.find((x) => x.id === sex.aktivitaet)
  const v = SEX_VERHUETUNG.find((x) => x.id === sex.verhuetung)
  const l = SEX_LIBIDO.find((x) => x.wert === sex.libido)
  if (a) teile.push(a.wort)
  if (v) teile.push(`Verhütung: ${v.wort}`)
  if (l) teile.push(`Libido ${l.wort}`)
  return teile.join(' · ')
}

export default function SexEingabe({ sex = {}, onChange, farbe }) {
  const setzen = (feld, wert) => onChange({ ...sex, [feld]: sex[feld] === wert ? undefined : wert })

  return (
    <div className="spalte">
      <div>
        <div className="klein leise abstand-unten">Aktivität</div>
        <div className="chips">
          {SEX_AKTIVITAET.map((o) => (
            <Chip key={o.id} option={o} klein farbe={farbe} aktiv={sex.aktivitaet === o.id} onClick={() => setzen('aktivitaet', o.id)} />
          ))}
        </div>
      </div>
      <div>
        <div className="klein leise abstand-unten">Verhütung</div>
        <div className="chips">
          {SEX_VERHUETUNG.map((o) => (
            <Chip key={o.id} option={o} klein farbe={farbe} aktiv={sex.verhuetung === o.id} onClick={() => setzen('verhuetung', o.id)} />
          ))}
        </div>
      </div>
      <div>
        <div className="klein leise abstand-unten">Libido</div>
        <div className="chips">
          {SEX_LIBIDO.map((o) => (
            <Chip
              key={o.wert}
              option={{ wort: o.wort, icon: o.icon }}
              klein
              farbe={farbe}
              aktiv={sex.libido === o.wert}
              onClick={() => setzen('libido', o.wert)}
            />
          ))}
        </div>
        <div className="fussnote">Nur die Libido fliesst in die Auswertung ein.</div>
      </div>
    </div>
  )
}
