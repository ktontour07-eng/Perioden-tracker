/** Kleine Statistikhelfer — bewusst ohne Abhaengigkeit. */

export function median(werte) {
  const w = werte.filter((x) => typeof x === 'number' && !Number.isNaN(x)).sort((a, b) => a - b)
  if (!w.length) return null
  const m = Math.floor(w.length / 2)
  return w.length % 2 ? w[m] : (w[m - 1] + w[m]) / 2
}

export function mittelwert(werte) {
  const w = werte.filter((x) => typeof x === 'number' && !Number.isNaN(x))
  if (!w.length) return null
  return w.reduce((s, x) => s + x, 0) / w.length
}

/** Lineare Interpolation zwischen den Rangplaetzen (Typ 7, wie in R/numpy) */
export function perzentil(werte, p) {
  const w = werte.filter((x) => typeof x === 'number' && !Number.isNaN(x)).sort((a, b) => a - b)
  if (!w.length) return null
  if (w.length === 1) return w[0]
  const pos = (w.length - 1) * p
  const unten = Math.floor(pos)
  const oben = Math.ceil(pos)
  if (unten === oben) return w[unten]
  return w[unten] + (w[oben] - w[unten]) * (pos - unten)
}

export function spanne(werte) {
  const w = werte.filter((x) => typeof x === 'number' && !Number.isNaN(x))
  if (!w.length) return null
  return { min: Math.min(...w), max: Math.max(...w) }
}

export function standardabweichung(werte) {
  const w = werte.filter((x) => typeof x === 'number' && !Number.isNaN(x))
  if (w.length < 2) return null
  const m = mittelwert(w)
  return Math.sqrt(w.reduce((s, x) => s + (x - m) ** 2, 0) / (w.length - 1))
}

export function runde(x, stellen = 1) {
  if (x === null || x === undefined || Number.isNaN(x)) return null
  const f = 10 ** stellen
  return Math.round(x * f) / f
}
