/**
 * Erzeugt die App-Icons ohne Bildbibliothek: ein kleiner PNG-Encoder reicht
 * fuer eine Ringgrafik. Aufruf: npm run icons
 *
 * Motiv: der Zyklusring aus der App — ein Kreis mit farbigen Phasenabschnitten
 * und einem Punkt fuer den aktuellen Tag.
 */

import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))
const ziel = resolve(hier, '../public/icons')

const GRUND = [250, 245, 243]
const PHASEN = [
  { bis: 0.18, farbe: [194, 100, 115] }, // Menstruation
  { bis: 0.5, farbe: [122, 166, 148] }, // Follikelphase
  { bis: 0.56, farbe: [217, 164, 65] }, // Eisprung
  { bis: 1, farbe: [139, 126, 168] }, // Lutealphase
]

function zeichne(groesse, { rand = true } = {}) {
  const p = new Uint8Array(groesse * groesse * 4)
  const mitte = groesse / 2
  const radius = groesse * (rand ? 0.3 : 0.36)
  const dicke = groesse * 0.1
  const punktWinkel = 0.42 // Position des Tagespunkts auf dem Ring

  for (let y = 0; y < groesse; y++) {
    for (let x = 0; x < groesse; x++) {
      const i = (y * groesse + x) * 4
      const dx = x + 0.5 - mitte
      const dy = y + 0.5 - mitte
      const abstand = Math.hypot(dx, dy)
      let farbe = GRUND
      let deckung = 1

      const aufRing = Math.abs(abstand - radius) < dicke / 2
      if (aufRing) {
        let winkel = Math.atan2(dy, dx) + Math.PI / 2
        if (winkel < 0) winkel += Math.PI * 2
        const anteil = (winkel / (Math.PI * 2)) % 1
        farbe = PHASEN.find((ph) => anteil <= ph.bis).farbe
        // weiche Kante
        deckung = weich(Math.abs(abstand - radius), dicke / 2 - 1, dicke / 2 + 0.6)
      }

      // Tagespunkt
      const px = mitte + radius * Math.cos(punktWinkel * Math.PI * 2 - Math.PI / 2)
      const py = mitte + radius * Math.sin(punktWinkel * Math.PI * 2 - Math.PI / 2)
      const punktAbstand = Math.hypot(x + 0.5 - px, y + 0.5 - py)
      if (punktAbstand < dicke * 0.62) {
        const d = weich(punktAbstand, dicke * 0.62 - 1, dicke * 0.62)
        farbe = mischen(farbe, [255, 253, 252], d)
        deckung = 1
      }

      const gemischt = mischen(GRUND, farbe, deckung)
      p[i] = gemischt[0]
      p[i + 1] = gemischt[1]
      p[i + 2] = gemischt[2]
      p[i + 3] = 255
    }
  }
  return p
}

const weich = (wert, innen, aussen) =>
  wert <= innen ? 1 : wert >= aussen ? 0 : 1 - (wert - innen) / (aussen - innen)

const mischen = (a, b, t) => a.map((x, i) => Math.round(x + (b[i] - x) * t))

/* --- minimaler PNG-Encoder ---------------------------------------- */

function png(breite, hoehe, pixel) {
  const roh = Buffer.alloc((breite * 4 + 1) * hoehe)
  for (let y = 0; y < hoehe; y++) {
    roh[y * (breite * 4 + 1)] = 0 // Filter: keiner
    Buffer.from(pixel.buffer, y * breite * 4, breite * 4).copy(roh, y * (breite * 4 + 1) + 1)
  }
  const teile = [
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    kapitel('IHDR', kopf(breite, hoehe)),
    kapitel('IDAT', deflateSync(roh, { level: 9 })),
    kapitel('IEND', Buffer.alloc(0)),
  ]
  return Buffer.concat(teile)
}

function kopf(breite, hoehe) {
  const b = Buffer.alloc(13)
  b.writeUInt32BE(breite, 0)
  b.writeUInt32BE(hoehe, 4)
  b[8] = 8 // Bittiefe
  b[9] = 6 // RGBA
  return b
}

function kapitel(typ, daten) {
  const laenge = Buffer.alloc(4)
  laenge.writeUInt32BE(daten.length)
  const koerper = Buffer.concat([Buffer.from(typ, 'ascii'), daten])
  const summe = Buffer.alloc(4)
  summe.writeUInt32BE(crc32(koerper) >>> 0)
  return Buffer.concat([laenge, koerper, summe])
}

const TABELLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buffer) {
  let c = 0xffffffff
  for (const b of buffer) c = TABELLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return c ^ 0xffffffff
}

/* --- SVG (fuer den Browser-Tab) ----------------------------------- */

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#faf5f3"/>
  <g fill="none" stroke-width="6" transform="rotate(-90 32 32)">
    <circle cx="32" cy="32" r="20" stroke="#c26473" stroke-dasharray="22.6 103.0"/>
    <circle cx="32" cy="32" r="20" stroke="#7aa694" stroke-dasharray="40.2 85.4" stroke-dashoffset="-22.6"/>
    <circle cx="32" cy="32" r="20" stroke="#d9a441" stroke-dasharray="7.5 118.1" stroke-dashoffset="-62.8"/>
    <circle cx="32" cy="32" r="20" stroke="#8b7ea8" stroke-dasharray="55.3 70.3" stroke-dashoffset="-70.3"/>
  </g>
  <circle cx="47" cy="27" r="5" fill="#fffdfc" stroke="#8b7ea8" stroke-width="2"/>
</svg>
`

mkdirSync(ziel, { recursive: true })
for (const [name, groesse, optionen] of [
  ['icon-192.png', 192, {}],
  ['icon-512.png', 512, {}],
  ['icon-maskable-512.png', 512, { rand: false }],
  ['apple-touch-icon.png', 180, {}],
]) {
  writeFileSync(resolve(ziel, name), png(groesse, groesse, zeichne(groesse, optionen)))
  console.log('geschrieben:', name)
}
writeFileSync(resolve(ziel, 'icon.svg'), svg)
console.log('geschrieben: icon.svg')
