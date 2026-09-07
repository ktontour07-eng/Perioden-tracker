/** Bindeglied zwischen IndexedDB und Oberflaeche. Live-Queries sorgen dafuer,
 *  dass jede Aenderung sofort ueberall sichtbar ist. */

import { useCallback, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, STANDARD_EINSTELLUNGEN, einstellungenSpeichern } from '../db/db.js'
import { aufbereiteteZyklen, aktuellerStand, arztHinweisNoetig } from '../logik/zyklus.js'
import { datenlage, meistgenutzteTags, zyklusDaten } from '../logik/auswertung.js'
import { heute } from '../logik/datum.js'
import { SCHNELLANSICHT_ANZAHL, STANDARD_FAVORITEN } from '../config/kategorien.js'

export function useEinstellungen() {
  // `null` statt `undefined`, wenn noch nichts gespeichert wurde — sonst liesse
  // sich „laedt noch“ nicht von „gibt es nicht“ unterscheiden.
  const gespeichert = useLiveQuery(
    async () => (await db.einstellungen.get('default')) ?? null,
    [],
    undefined,
  )
  const einstellungen = useMemo(
    () => ({ ...STANDARD_EINSTELLUNGEN, ...(gespeichert || {}) }),
    [gespeichert],
  )
  const speichern = useCallback((teil) => einstellungenSpeichern(teil), [])
  return [einstellungen, speichern, gespeichert !== undefined]
}

export function useEintraege() {
  return useLiveQuery(() => db.eintraege.toArray(), [], null)
}

export function useZyklen() {
  return useLiveQuery(() => db.zyklen.toArray(), [], null)
}

/** Alles, was die Bildschirme gemeinsam brauchen. */
export function useAppDaten(bezugsdatum = heute()) {
  const eintraege = useEintraege()
  const zyklen = useZyklen()
  const [einstellungen, speichern, geladen] = useEinstellungen()

  const laedt = eintraege === null || zyklen === null || !geladen

  const aufbereitet = useMemo(
    () => aufbereiteteZyklen(zyklen || [], bezugsdatum),
    [zyklen, bezugsdatum],
  )
  const stand = useMemo(() => aktuellerStand(aufbereitet, bezugsdatum), [aufbereitet, bezugsdatum])
  const lage = useMemo(() => datenlage(aufbereitet), [aufbereitet])
  const arzt = useMemo(() => arztHinweisNoetig(aufbereitet, bezugsdatum), [aufbereitet, bezugsdatum])
  const daten = useMemo(() => zyklusDaten(aufbereitet, eintraege || []), [aufbereitet, eintraege])

  const schnellTags = useMemo(() => {
    if (!einstellungen.favoritenAutomatisch) return einstellungen.favoritenTags || STANDARD_FAVORITEN
    const genutzt = meistgenutzteTags(eintraege || [], SCHNELLANSICHT_ANZAHL).map((t) => t.key)
    const rest = (einstellungen.favoritenTags || STANDARD_FAVORITEN).filter((k) => !genutzt.includes(k))
    return [...genutzt, ...rest].slice(0, SCHNELLANSICHT_ANZAHL)
  }, [eintraege, einstellungen])

  return {
    laedt,
    eintraege: eintraege || [],
    zyklen: aufbereitet,
    einstellungen,
    einstellungenSpeichern: speichern,
    stand,
    lage,
    arzt,
    zyklusDaten: daten,
    schnellTags,
    bezugsdatum,
  }
}
