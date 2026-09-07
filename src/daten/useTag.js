/** Ein Tag zum Bearbeiten: laedt aus der Datenbank, speichert verzoegert
 *  zurueck. Ohne Speichern-Knopf — jeder Tipp ist sofort gesichert. */

import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'
import { LEERER_EINTRAG, eintragSpeichern } from '../db/eintraege.js'

export function useTag(datum) {
  const gespeichert = useLiveQuery(() => db.eintraege.get(datum), [datum], undefined)
  const [entwurf, setEntwurf] = useState(() => LEERER_EINTRAG(datum))
  const timer = useRef(null)
  const eigeneAenderung = useRef(false)

  // Von aussen kommende Aenderungen uebernehmen (Datumswechsel, Import).
  useEffect(() => {
    if (gespeichert === undefined) return
    if (eigeneAenderung.current) return
    setEntwurf({ ...LEERER_EINTRAG(datum), ...(gespeichert || {}) })
  }, [gespeichert, datum])

  useEffect(() => {
    eigeneAenderung.current = false
    setEntwurf({ ...LEERER_EINTRAG(datum) })
  }, [datum])

  useEffect(() => () => clearTimeout(timer.current), [])

  const aendern = (teil) => {
    eigeneAenderung.current = true
    setEntwurf((alt) => {
      const neu = { ...alt, ...teil }
      clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        eigeneAenderung.current = false
        eintragSpeichern(neu)
      }, 250)
      return neu
    })
  }

  return { eintrag: entwurf, aendern, geladen: gespeichert !== undefined }
}
