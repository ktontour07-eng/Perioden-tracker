/**
 * Datumshilfen. Alle Datumsangaben in der App sind lokale ISO-Strings
 * 'YYYY-MM-DD' — nie Date-Objekte in der Datenbank, damit Zeitzonen und
 * Sommerzeit keine Tagesverschiebung erzeugen koennen.
 */

export function heute() {
  return alsISO(new Date())
}

export function alsISO(date) {
  const j = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const t = String(date.getDate()).padStart(2, '0')
  return `${j}-${m}-${t}`
}

export function ausISO(iso) {
  const [j, m, t] = iso.split('-').map(Number)
  return new Date(j, m - 1, t)
}

/** Tage addieren (auch negativ) */
export function plusTage(iso, tage) {
  const d = ausISO(iso)
  d.setDate(d.getDate() + tage)
  return alsISO(d)
}

/** b - a in ganzen Tagen */
export function tageDazwischen(a, b) {
  const ms = ausISO(b).getTime() - ausISO(a).getTime()
  return Math.round(ms / 86400000)
}

const WOCHENTAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
const MONATE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

export function formatKurz(iso) {
  const d = ausISO(iso)
  return `${d.getDate()}.${d.getMonth() + 1}.`
}

export function formatLang(iso) {
  const d = ausISO(iso)
  return `${WOCHENTAGE[d.getDay()]}, ${d.getDate()}. ${MONATE[d.getMonth()]} ${d.getFullYear()}`
}

export function formatMitJahr(iso) {
  const d = ausISO(iso)
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`
}

export function formatWochentag(iso) {
  return WOCHENTAGE[ausISO(iso).getDay()]
}

/** Alle Tage von a bis b (einschliesslich) */
export function tagesSpanne(a, b) {
  const tage = []
  let d = a
  let schutz = 0
  while (d <= b && schutz++ < 2000) {
    tage.push(d)
    d = plusTage(d, 1)
  }
  return tage
}

/** Relative Angabe: "heute", "gestern", sonst kurzes Datum */
export function relativ(iso, bezug = heute()) {
  const diff = tageDazwischen(iso, bezug)
  if (diff === 0) return 'heute'
  if (diff === 1) return 'gestern'
  if (diff === -1) return 'morgen'
  return formatKurz(iso)
}
