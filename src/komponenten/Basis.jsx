/** Kleine, wiederverwendbare Bausteine. Keine Wortlisten hier — die stehen
 *  in src/config/kategorien.js. */

import { useEffect, useRef, useState } from 'react'

export function Chip({ option, aktiv, onClick, farbe, klein = false, title }) {
  return (
    <button
      type="button"
      className={`chip${klein ? ' klein' : ''}`}
      aria-pressed={aktiv}
      title={title}
      onClick={onClick}
      style={
        aktiv && farbe
          ? { '--chip-farbe': misch(farbe), '--chip-rand': farbe }
          : undefined
      }
    >
      {option.icon && <span className="icon" aria-hidden="true">{option.icon}</span>}
      <span>{option.wort}</span>
    </button>
  )
}

/** Skala: grosse Flaechen, ein Fingertipp. Nochmaliges Tippen loescht den Wert. */
export function Skala({ optionen, wert, onChange, farbe }) {
  return (
    <div className="skala" role="group">
      {optionen.map((o) => {
        const aktiv = wert === o.wert
        return (
          <button
            key={o.wert}
            type="button"
            aria-pressed={aktiv}
            onClick={() => onChange(aktiv ? null : o.wert)}
            style={{ '--skala-farbe': o.farbe || farbe, '--skala-hell': misch(o.farbe || farbe) }}
          >
            <span className="icon" aria-hidden="true">{o.icon}</span>
            <span>{o.wort}</span>
          </button>
        )
      })}
    </div>
  )
}

export function TagWahl({ optionen, werte = [], onChange, farbe }) {
  const umschalten = (id) =>
    onChange(werte.includes(id) ? werte.filter((w) => w !== id) : [...werte, id])
  return (
    <div className="chips">
      {optionen.map((o) => (
        <Chip key={o.id} option={o} farbe={farbe} aktiv={werte.includes(o.id)} onClick={() => umschalten(o.id)} />
      ))}
    </div>
  )
}

export function Aufklappbar({ titel, farbe, zusammenfassung, offen, onUmschalten, children }) {
  return (
    <section className="gruppe" data-offen={offen}>
      <button type="button" className="gruppe-kopf" onClick={onUmschalten} aria-expanded={offen}>
        <span className="gruppe-titel">
          <span className="gruppe-punkt" style={{ '--punkt-farbe': farbe }} aria-hidden="true" />
          {titel}
        </span>
        <span className="gruppe-zusammenfassung">{zusammenfassung}</span>
        <span className="gruppe-pfeil" aria-hidden="true">›</span>
      </button>
      {offen && <div className="gruppe-inhalt">{children}</div>}
    </section>
  )
}

export function Wippe({ an, onChange, titel, beschreibung }) {
  return (
    <div className="schalter">
      <div className="schalter-text">
        <div>{titel}</div>
        {beschreibung && <div className="klein">{beschreibung}</div>}
      </div>
      <button
        type="button"
        className="wippe"
        role="switch"
        aria-checked={an}
        aria-label={titel}
        onClick={() => onChange(!an)}
      />
    </div>
  )
}

export function Dialog({ titel, onSchliessen, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const beiTaste = (e) => e.key === 'Escape' && onSchliessen()
    document.addEventListener('keydown', beiTaste)
    return () => document.removeEventListener('keydown', beiTaste)
  }, [onSchliessen])

  return (
    <div
      className="dialog-hintergrund"
      onClick={(e) => e.target === e.currentTarget && onSchliessen()}
    >
      <div className="dialog" ref={ref} role="dialog" aria-modal="true" aria-label={titel}>
        <div className="zeile-verteilt abstand-unten">
          <h2>{titel}</h2>
          <button type="button" className="knopf leise" onClick={onSchliessen}>Fertig</button>
        </div>
        {children}
      </div>
    </div>
  )
}

/** Kurzzeitige Rueckmeldung ohne Unterbrechung. */
export function useMeldung(dauer = 2600) {
  const [meldung, setMeldung] = useState(null)
  useEffect(() => {
    if (!meldung) return
    const t = setTimeout(() => setMeldung(null), dauer)
    return () => clearTimeout(t)
  }, [meldung, dauer])
  return [meldung, setMeldung]
}

/** Farbe stark aufhellen — fuer Hintergruende aktiver Chips. */
export function misch(farbe) {
  if (!farbe) return undefined
  return `color-mix(in srgb, ${farbe} 22%, transparent)`
}
