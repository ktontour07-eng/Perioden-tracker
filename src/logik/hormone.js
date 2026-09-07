/**
 * Idealisierter Hormonverlauf — ausdruecklich KEIN Diagramm eigener Werte
 * (Briefing 7.4). Es ist ein Lehrbuchmodell, auf die eigene Zykluslaenge
 * gestreckt. Ohne Blut- oder LH-Test misst die App nichts davon.
 *
 * Die Kurven sind auf 0–1 normiert; absolute Einheiten waeren hier nur
 * vorgetaeuschte Genauigkeit.
 */

import { REGELN } from '../config/kategorien.js'

const glocke = (x, mitte, breite) => Math.exp(-((x - mitte) ** 2) / (2 * breite ** 2))

export const HORMONE = [
  { id: 'oestrogen', wort: 'Östrogen', farbe: '#7aa694' },
  { id: 'progesteron', wort: 'Progesteron', farbe: '#8b7ea8' },
  { id: 'lh', wort: 'LH', farbe: '#d9a441' },
  { id: 'fsh', wort: 'FSH', farbe: '#7ba3b5' },
]

/**
 * @param {number} laenge  Zykluslaenge in Tagen
 * @returns {{tag:number, oestrogen:number, progesteron:number, lh:number, fsh:number}[]}
 */
export function hormonVerlauf(laenge = REGELN.fallbackZykluslaenge) {
  const L = Math.max(20, Math.min(laenge || REGELN.fallbackZykluslaenge, 60))
  const eisprung = L - REGELN.lutealTage
  const punkte = []
  for (let tag = 1; tag <= L; tag++) {
    const nachEisprung = tag - eisprung
    const oestrogen =
      0.12 +
      0.78 * glocke(tag, eisprung - 1, Math.max(2.2, eisprung / 5)) +
      0.34 * glocke(nachEisprung, 7, 3.4)
    const progesteron = 0.05 + 0.95 * glocke(nachEisprung, 7, 3.1) * (nachEisprung > -2 ? 1 : 0)
    const lh = 0.08 + 0.92 * glocke(tag, eisprung, 0.9)
    const fsh =
      0.18 + 0.5 * glocke(tag, 2, 2.6) + 0.42 * glocke(tag, eisprung, 1.4)
    punkte.push({
      tag,
      oestrogen: begrenzt(oestrogen),
      progesteron: begrenzt(progesteron),
      lh: begrenzt(lh),
      fsh: begrenzt(fsh),
    })
  }
  return punkte
}

const begrenzt = (x) => Math.max(0, Math.min(1, x))
