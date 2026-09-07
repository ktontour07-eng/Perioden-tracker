/**
 * IndexedDB via Dexie. Alle Daten bleiben auf dem Geraet — kein Backend,
 * kein Sync, keine Accounts (Briefing 2).
 *
 * Wichtig: Safari kann IndexedDB loeschen, wenn die App ~7 Wochen ungenutzt
 * bleibt. Deshalb ist der JSON-Export in db/backup.js Pflichtfeature.
 */

import Dexie from 'dexie'
import { STANDARD_FAVORITEN } from '../config/kategorien.js'

export const db = new Dexie('zyklus-tracker')

db.version(1).stores({
  // date ist Primaerschluessel: genau ein Eintrag pro Tag
  eintraege: '&date',
  zyklen: '++id, startDate',
  einstellungen: '&id',
})

export const STANDARD_EINSTELLUNGEN = {
  id: 'default',
  hormonelleVerhuetung: false,
  versteckteKategorien: [], // Kategorien-IDs, die im Tageseintrag nicht erscheinen
  eigeneMedikamente: [],
  favoritenTags: STANDARD_FAVORITEN,
  favoritenAutomatisch: true, // Schnellansicht aus der eigenen Nutzung ableiten
  weggewischteSprueche: [],
  arztHinweisGesehen: false,
  letzterExport: null,
}

export async function einstellungenLaden() {
  const vorhanden = await db.einstellungen.get('default')
  if (vorhanden) return { ...STANDARD_EINSTELLUNGEN, ...vorhanden }
  await db.einstellungen.put(STANDARD_EINSTELLUNGEN)
  return { ...STANDARD_EINSTELLUNGEN }
}

export async function einstellungenSpeichern(teil) {
  const aktuell = await einstellungenLaden()
  const neu = { ...aktuell, ...teil, id: 'default' }
  await db.einstellungen.put(neu)
  return neu
}
