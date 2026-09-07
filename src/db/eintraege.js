/** Lese- und Schreibzugriffe auf Tageseintraege und Zyklen. */

import { db } from './db.js'
import { zyklusVorschlaege } from '../logik/zyklus.js'
import { istBefuellt } from '../logik/auswertung.js'

export const LEERER_EINTRAG = (date) => ({
  date,
  blutung: null,
  stimmung: null,
  energie: null,
  gefuehle: [],
  geist: [],
  haut: [],
  sozial: [],
  ausfluss: [],
  schmerzen: [],
  sex: {},
  medikamente: [],
  notiz: '',
})

export async function eintragLaden(date) {
  const e = await db.eintraege.get(date)
  return e ? { ...LEERER_EINTRAG(date), ...e } : LEERER_EINTRAG(date)
}

/**
 * Speichert einen Tag und haelt danach die Zyklusobjekte nach.
 * Leere Tage werden geloescht, damit sie in der Auswertung nicht als
 * „nichts gehabt“ zaehlen.
 */
export async function eintragSpeichern(eintrag) {
  if (istBefuellt(eintrag)) {
    await db.eintraege.put({ ...eintrag })
  } else {
    await db.eintraege.delete(eintrag.date)
  }
  await zyklenNachfuehren()
}

/**
 * Legt aus den Blutungseintraegen fehlende Zyklen an und aktualisiert die
 * Blutungsenden. Vorhandene Zyklen werden nie ueberschrieben — Status und
 * Statistikflag bleiben in der Hand der Nutzerin.
 */
export async function zyklenNachfuehren() {
  const [eintraege, zyklen] = await Promise.all([db.eintraege.toArray(), db.zyklen.toArray()])
  const { neueStarts, enden, aenderungen } = zyklusVorschlaege(eintraege, zyklen)

  if (neueStarts.length) {
    await db.zyklen.bulkAdd(
      neueStarts.map((startDate) => ({
        startDate,
        endDate: enden[startDate] || startDate,
        status: 'normal',
        inStatistik: true,
        statusManuell: false,
        inStatistikManuell: false,
        angelegt: new Date().toISOString(),
      })),
    )
  }
  for (const a of aenderungen) {
    await db.zyklen.update(a.id, { endDate: a.endDate })
  }

  // Zyklen ohne verbleibenden Blutungseintrag wieder entfernen (z. B. wenn
  // ein Periodenstart versehentlich eingetragen und wieder geloescht wurde).
  const aktuelleZyklen = await db.zyklen.toArray()
  const datumMitBlutung = new Set(
    eintraege.filter((e) => (e.blutung || 0) >= 1).map((e) => e.date),
  )
  for (const z of aktuelleZyklen) {
    if (!z.manuell && !datumMitBlutung.has(z.startDate)) {
      await db.zyklen.delete(z.id)
    }
  }
}

export async function zyklusAktualisieren(id, aenderung) {
  await db.zyklen.update(id, aenderung)
}

export async function zyklusAnlegen(startDate) {
  return db.zyklen.add({
    startDate,
    endDate: null,
    status: 'normal',
    inStatistik: true,
    statusManuell: false,
    inStatistikManuell: false,
    manuell: true,
    angelegt: new Date().toISOString(),
  })
}

export async function zyklusLoeschen(id) {
  await db.zyklen.delete(id)
}

export async function allesLoeschen() {
  await db.transaction('rw', db.eintraege, db.zyklen, async () => {
    await db.eintraege.clear()
    await db.zyklen.clear()
  })
}
