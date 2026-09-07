/**
 * Export / Import als JSON — Pflichtfeature (Briefing 2): Safari kann
 * IndexedDB nach rund sieben Wochen Nichtnutzung loeschen. Ohne Export waeren
 * die Daten dann weg.
 */

import { db, einstellungenLaden, einstellungenSpeichern } from './db.js'
import { heute } from '../logik/datum.js'

export const EXPORT_VERSION = 1

export async function datenExportieren() {
  const [eintraege, zyklen, einstellungen] = await Promise.all([
    db.eintraege.toArray(),
    db.zyklen.toArray(),
    einstellungenLaden(),
  ])
  return {
    format: 'zyklus-tracker',
    version: EXPORT_VERSION,
    exportiertAm: new Date().toISOString(),
    einstellungen,
    zyklen,
    eintraege,
  }
}

export function dateinameFuerExport() {
  return `zyklus-daten-${heute()}.json`
}

/** Loest den Download der JSON-Datei aus. */
export async function exportHerunterladen() {
  const daten = await datenExportieren()
  const blob = new Blob([JSON.stringify(daten, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = dateinameFuerExport()
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  await einstellungenSpeichern({ letzterExport: new Date().toISOString() })
  return daten
}

export function importPruefen(objekt) {
  if (!objekt || typeof objekt !== 'object') return 'Datei ist keine gültige Sicherung.'
  if (objekt.format !== 'zyklus-tracker') return 'Diese Datei stammt nicht aus dieser App.'
  if (!Array.isArray(objekt.eintraege) || !Array.isArray(objekt.zyklen))
    return 'In der Datei fehlen Einträge oder Zyklen.'
  if (objekt.version > EXPORT_VERSION)
    return 'Die Datei stammt aus einer neueren Version der App.'
  return null
}

/**
 * @param {object} daten     geparste JSON-Datei
 * @param {'ersetzen'|'zusammenfuehren'} modus
 */
export async function datenImportieren(daten, modus = 'ersetzen') {
  const fehler = importPruefen(daten)
  if (fehler) throw new Error(fehler)

  await db.transaction('rw', db.eintraege, db.zyklen, db.einstellungen, async () => {
    if (modus === 'ersetzen') {
      await db.eintraege.clear()
      await db.zyklen.clear()
    }
    await db.eintraege.bulkPut(daten.eintraege)

    const vorhandene = new Set((await db.zyklen.toArray()).map((z) => z.startDate))
    const neue = daten.zyklen
      .filter((z) => !vorhandene.has(z.startDate))
      .map(({ id, ...rest }) => rest)
    if (neue.length) await db.zyklen.bulkAdd(neue)

    if (daten.einstellungen) {
      const { id, ...rest } = daten.einstellungen
      await einstellungenSpeichern(rest)
    }
  })

  return {
    eintraege: daten.eintraege.length,
    zyklen: daten.zyklen.length,
  }
}

/** Liest eine vom Nutzer gewaehlte Datei ein. */
export function dateiLesen(file) {
  return new Promise((resolve, reject) => {
    const leser = new FileReader()
    leser.onload = () => {
      try {
        resolve(JSON.parse(String(leser.result)))
      } catch {
        reject(new Error('Die Datei liess sich nicht lesen — ist es wirklich die JSON-Sicherung?'))
      }
    }
    leser.onerror = () => reject(new Error('Die Datei liess sich nicht öffnen.'))
    leser.readAsText(file)
  })
}
