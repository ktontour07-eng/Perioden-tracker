/**
 * Zweistufige Schmerzeingabe (Briefing 5): erst Region, danach Art und
 * Intensitaet. Eine flache Liste haette 7 x 5 x 3 Optionen.
 */

import { useState } from 'react'
import { SCHMERZ_ARTEN, SCHMERZ_INTENSITAET, SCHMERZ_REGIONEN } from '../config/kategorien.js'
import { Chip } from './Basis.jsx'

const regionWort = (id) => SCHMERZ_REGIONEN.find((r) => r.id === id)?.wort || id
const artWort = (id) => SCHMERZ_ARTEN.find((a) => a.id === id)?.wort || id
const intensitaetWort = (w) => SCHMERZ_INTENSITAET.find((i) => i.wert === w)?.wort || w

export function schmerzText(schmerzen = []) {
  return schmerzen
    .map((s) => `${regionWort(s.region)}${s.art ? ', ' + artWort(s.art) : ''} (${intensitaetWort(s.intensitaet)})`)
    .join(' · ')
}

export default function Schmerzeingabe({ schmerzen = [], onChange, farbe }) {
  const [offeneRegion, setOffeneRegion] = useState(null)

  const eintragFuer = (region) => schmerzen.find((s) => s.region === region)

  const regionTippen = (region) => {
    const vorhanden = eintragFuer(region)
    if (vorhanden) {
      // zweiter Tipp auf eine gesetzte Region: Details auf/zu
      setOffeneRegion(offeneRegion === region ? null : region)
    } else {
      onChange([...schmerzen, { region, art: null, intensitaet: 2 }])
      setOffeneRegion(region)
    }
  }

  const aendern = (region, teil) =>
    onChange(schmerzen.map((s) => (s.region === region ? { ...s, ...teil } : s)))

  const entfernen = (region) => {
    onChange(schmerzen.filter((s) => s.region !== region))
    if (offeneRegion === region) setOffeneRegion(null)
  }

  return (
    <div className="spalte">
      <div className="chips">
        {SCHMERZ_REGIONEN.map((r) => (
          <Chip
            key={r.id}
            option={r}
            farbe={farbe}
            aktiv={!!eintragFuer(r.id)}
            onClick={() => regionTippen(r.id)}
          />
        ))}
      </div>

      {schmerzen.map((s) => {
        const offen = offeneRegion === s.region
        return (
          <div key={s.region} className="karte" style={{ margin: 0, padding: 12 }}>
            <div className="zeile-verteilt">
              <strong style={{ fontSize: '0.9rem' }}>{regionWort(s.region)}</strong>
              <button type="button" className="knopf leise klein" onClick={() => entfernen(s.region)}>
                entfernen
              </button>
            </div>

            {offen ? (
              <>
                <div className="klein leise abstand-oben">Art</div>
                <div className="chips">
                  {SCHMERZ_ARTEN.map((a) => (
                    <Chip
                      key={a.id}
                      option={a}
                      klein
                      farbe={farbe}
                      aktiv={s.art === a.id}
                      onClick={() => aendern(s.region, { art: s.art === a.id ? null : a.id })}
                    />
                  ))}
                </div>
                <div className="klein leise abstand-oben">Intensität</div>
                <div className="chips">
                  {SCHMERZ_INTENSITAET.map((i) => (
                    <Chip
                      key={i.wert}
                      option={{ wort: i.wort, icon: i.icon }}
                      klein
                      farbe={farbe}
                      aktiv={s.intensitaet === i.wert}
                      onClick={() => aendern(s.region, { intensitaet: i.wert })}
                    />
                  ))}
                </div>
              </>
            ) : (
              <button
                type="button"
                className="klein leise"
                style={{ marginTop: 4 }}
                onClick={() => setOffeneRegion(s.region)}
              >
                {s.art ? artWort(s.art) : 'Art offen'} · {intensitaetWort(s.intensitaet)} — ändern
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
