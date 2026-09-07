/**
 * Rahmen: Tab-Navigation und gemeinsame Daten. Kein Router — vier Ansichten
 * plus die Uebersicht fuers Arztgespraech.
 */

import { useEffect, useState } from 'react'
import { heute as heuteISO } from './logik/datum.js'
import { useAppDaten } from './daten/useDaten.js'
import Heute from './ansichten/Heute.jsx'
import Zyklen from './ansichten/Zyklen.jsx'
import Auswertung from './ansichten/Auswertung.jsx'
import Einstellungen from './ansichten/Einstellungen.jsx'
import Bericht from './ansichten/Bericht.jsx'

const TABS = [
  { id: 'heute', wort: 'Heute', symbol: '◔' },
  { id: 'zyklen', wort: 'Zyklen', symbol: '≡' },
  { id: 'auswertung', wort: 'Auswertung', symbol: '◫' },
  { id: 'einstellungen', wort: 'Mehr', symbol: '⚙' },
]

export default function App() {
  const [ansicht, setAnsicht] = useState(() => window.location.hash.slice(1) || 'heute')
  const [aktion, setAktion] = useState(null)
  const [datum, setDatum] = useState(heuteISO())

  // Wechsel mit Auftrag: „Periode nachtragen“ soll den Dialog gleich oeffnen.
  const gehZu = (ziel, auftrag = null) => {
    setAnsicht(ziel)
    setAktion(auftrag)
  }
  const daten = useAppDaten(heuteISO())

  useEffect(() => {
    window.location.hash = ansicht
    window.scrollTo({ top: 0 })
  }, [ansicht])

  useEffect(() => {
    const beiHash = () => setAnsicht(window.location.hash.slice(1) || 'heute')
    window.addEventListener('hashchange', beiHash)
    return () => window.removeEventListener('hashchange', beiHash)
  }, [])

  if (daten.laedt) {
    return (
      <div className="app">
        <div className="inhalt mitte" style={{ paddingTop: '30vh' }}>
          <div className="leise klein">einen Moment …</div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <main className="inhalt">
        {ansicht === 'heute' && (
          <Heute daten={daten} datum={datum} aufDatum={setDatum} gehZu={gehZu} />
        )}
        {ansicht === 'zyklen' && (
          <Zyklen daten={daten} gehZu={gehZu} aktion={aktion} aktionErledigt={() => setAktion(null)} />
        )}
        {ansicht === 'auswertung' && <Auswertung daten={daten} />}
        {ansicht === 'einstellungen' && <Einstellungen daten={daten} />}
        {ansicht === 'bericht' && <Bericht daten={daten} gehZu={gehZu} />}
      </main>

      <nav className="tableiste" aria-label="Hauptnavigation">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-current={ansicht === t.id || (t.id === 'zyklen' && ansicht === 'bericht') ? 'page' : undefined}
            onClick={() => gehZu(t.id)}
          >
            <span className="symbol" aria-hidden="true">{t.symbol}</span>
            <span>{t.wort}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
