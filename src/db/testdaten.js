/**
 * Testdaten fuer sechs Zyklen (Briefing 10.1).
 *
 * Ohne Testdaten waeren die Diagramme monatelang weder sichtbar noch
 * entwickelbar. Die Daten enthalten absichtlich ein erkennbares Muster
 * (luteal schlechtere Stimmung, weniger Energie, mehr Reizbarkeit und Pickel)
 * und einen ausgebliebenen Zyklus, damit Wartemodus und Statusverwaltung
 * ueberhaupt auftreten.
 *
 * Deterministischer Zufall: derselbe Startwert erzeugt dieselben Daten.
 */

import { db } from './db.js'
import { heute as heuteISO, plusTage } from '../logik/datum.js'
import { REGELN } from '../config/kategorien.js'

function zufall(seed) {
  let a = seed >>> 0
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const waehle = (r, liste) => liste[Math.floor(r() * liste.length)]
const vielleicht = (r, p) => r() < p

/**
 * Erzeugt Zyklen und Tageseintraege, ohne sie zu speichern.
 * @param {object} opt
 * @param {string} opt.bisDatum     letzter Tag (Standard: heute)
 * @param {number[]} opt.laengen    Zykluslaengen, aeltester zuerst
 * @param {number} opt.seed
 */
export function testdatenErzeugen({
  bisDatum = heuteISO(),
  laengen = [29, 27, 31, 26, 52, 28, 30],
  seed = 42,
  luecken = 0.12,
} = {}) {
  const r = zufall(seed)
  const gesamt = laengen.reduce((s, l) => s + l, 0)
  // Der letzte Zyklus laeuft noch: er beginnt so, dass heute etwa Tag 12 ist.
  const laufendTag = 12
  const ersterStart = plusTage(bisDatum, -(gesamt + laufendTag - 1))

  const zyklen = []
  const eintraege = []
  let start = ersterStart

  const alleLaengen = [...laengen, laufendTag]
  for (let zi = 0; zi < alleLaengen.length; zi++) {
    const laenge = alleLaengen[zi]
    const laufend = zi === alleLaengen.length - 1
    const ausgeblieben = laenge > REGELN.maxLang
    const mensTage = ausgeblieben ? 6 : 4 + Math.floor(r() * 2)
    const eisprung = laenge - REGELN.lutealTage

    zyklen.push({
      startDate: start,
      endDate: plusTage(start, mensTage - 1),
      status: laufend ? 'normal' : ausgeblieben ? 'ausgeblieben' : 'normal',
      inStatistik: !laufend && !ausgeblieben,
      statusManuell: false,
      inStatistikManuell: false,
      angelegt: new Date().toISOString(),
      testdaten: true,
    })

    for (let tag = 1; tag <= laenge; tag++) {
      const datum = plusTage(start, tag - 1)
      if (datum > bisDatum) break
      if (vielleicht(r, luecken) && tag > mensTage) continue // nicht jeder Tag wird eingetragen

      const nachEisprung = tag - eisprung
      const inMens = tag <= mensTage
      const inLuteal = !ausgeblieben && nachEisprung > 0
      const spaetLuteal = inLuteal && nachEisprung > laenge - eisprung - 6

      const blutung = inMens ? [4, 4, 3, 2, 1, 1][tag - 1] ?? 1 : vielleicht(r, 0.03) ? 1 : 0

      let stimmung = 3.6
      if (inMens) stimmung -= 0.5
      if (!ausgeblieben && !inLuteal && !inMens) stimmung += 0.6
      if (spaetLuteal) stimmung -= 1.2
      else if (inLuteal) stimmung -= 0.4
      if (ausgeblieben && tag > 30) stimmung -= 0.5
      stimmung = begrenze(Math.round(stimmung + (r() - 0.5) * 1.6), 1, 5)

      let energie = 2.9
      if (inMens) energie -= 0.8
      if (!inLuteal && !inMens) energie += 0.7
      if (spaetLuteal) energie -= 0.7
      energie = begrenze(Math.round(energie + (r() - 0.5) * 1.2), 1, 4)

      const gefuehle = []
      if (spaetLuteal) {
        if (vielleicht(r, 0.62)) gefuehle.push('reizbar')
        if (vielleicht(r, 0.45)) gefuehle.push('sensibel')
        if (vielleicht(r, 0.35)) gefuehle.push('stimmungsschwankungen')
        if (vielleicht(r, 0.25)) gefuehle.push('traurig')
      } else if (!inLuteal && !inMens) {
        if (vielleicht(r, 0.5)) gefuehle.push('gut')
        if (vielleicht(r, 0.3)) gefuehle.push('froehlich')
        if (vielleicht(r, 0.22)) gefuehle.push('selbstbewusst')
      } else {
        if (vielleicht(r, 0.3)) gefuehle.push(waehle(r, ['gut', 'sensibel', 'dankbar']))
        if (vielleicht(r, 0.18)) gefuehle.push('unruhig')
      }

      const geist = []
      if (spaetLuteal && vielleicht(r, 0.4)) geist.push('brainfog')
      if (vielleicht(r, inLuteal ? 0.4 : 0.22)) geist.push('gestresst')
      if (!inLuteal && !inMens && vielleicht(r, 0.4)) geist.push(waehle(r, ['klar', 'motiviert', 'konzentriert']))
      if (spaetLuteal && vielleicht(r, 0.25)) geist.push('ueberfordert')

      const sozial = []
      if (spaetLuteal && vielleicht(r, 0.4)) sozial.push('zurueckgezogen')
      if (!inLuteal && !inMens && vielleicht(r, 0.35)) sozial.push('gesellig')
      if (spaetLuteal && vielleicht(r, 0.2)) sozial.push('streitlustig')

      const haut = []
      if (spaetLuteal && vielleicht(r, 0.5)) haut.push('pickel')
      else if (!inLuteal && !inMens && vielleicht(r, 0.3)) haut.push('gut')
      if (inMens && vielleicht(r, 0.2)) haut.push('empfindlich')

      const ausfluss = []
      if (!inMens) {
        const nahEisprung = Math.abs(tag - eisprung) <= 2
        if (nahEisprung) ausfluss.push(vielleicht(r, 0.7) ? 'eiweissartig' : 'waessrig')
        else if (inLuteal) ausfluss.push(vielleicht(r, 0.6) ? 'cremig' : 'klebrig')
        else if (vielleicht(r, 0.5)) ausfluss.push('klebrig')
      }

      const schmerzen = []
      if (inMens && tag <= 2 && vielleicht(r, 0.8)) {
        schmerzen.push({ region: 'unterleib', art: 'krampfartig', intensitaet: tag === 1 ? 3 : 2 })
      }
      if (inMens && vielleicht(r, 0.3)) {
        schmerzen.push({ region: 'ruecken', art: 'ziehend', intensitaet: 2 })
      }
      if (spaetLuteal && vielleicht(r, 0.35)) {
        schmerzen.push({ region: 'brust', art: 'ziehend', intensitaet: vielleicht(r, 0.4) ? 2 : 1 })
      }
      if (vielleicht(r, 0.08)) {
        schmerzen.push({ region: 'kopf', art: 'dumpf', intensitaet: 2 })
      }

      const sex = {}
      if (vielleicht(r, 0.18)) {
        sex.aktivitaet = vielleicht(r, 0.6) ? 'partner' : 'solo'
        sex.verhuetung = vielleicht(r, 0.7) ? 'kondom' : 'keine'
      }
      if (vielleicht(r, 0.5)) {
        sex.libido = !inLuteal && !inMens ? (vielleicht(r, 0.6) ? 3 : 2) : vielleicht(r, 0.6) ? 1 : 2
      }

      eintraege.push({
        date: datum,
        blutung,
        stimmung,
        energie,
        gefuehle,
        geist,
        haut,
        sozial,
        ausfluss,
        schmerzen,
        sex,
        medikamente: [],
        notiz: spaetLuteal && vielleicht(r, 0.08) ? 'Schlecht geschlafen.' : '',
        testdaten: true,
      })
    }

    start = plusTage(start, laenge)
  }

  return { zyklen, eintraege }
}

const begrenze = (x, min, max) => Math.max(min, Math.min(max, x))

/** Schreibt die Testdaten in die Datenbank (ersetzt vorhandene Daten). */
export async function testdatenLaden(optionen = {}) {
  const { zyklen, eintraege } = testdatenErzeugen(optionen)
  await db.transaction('rw', db.eintraege, db.zyklen, async () => {
    await db.eintraege.clear()
    await db.zyklen.clear()
    await db.eintraege.bulkPut(eintraege)
    await db.zyklen.bulkAdd(zyklen)
  })
  return { zyklen: zyklen.length, eintraege: eintraege.length }
}

/** Nur die Testdaten wieder entfernen, eigene Eintraege bleiben. */
export async function testdatenEntfernen() {
  const eintraege = await db.eintraege.filter((e) => e.testdaten === true).toArray()
  const zyklen = await db.zyklen.filter((z) => z.testdaten === true).toArray()
  await db.eintraege.bulkDelete(eintraege.map((e) => e.date))
  await db.zyklen.bulkDelete(zyklen.map((z) => z.id))
  return { eintraege: eintraege.length, zyklen: zyklen.length }
}

