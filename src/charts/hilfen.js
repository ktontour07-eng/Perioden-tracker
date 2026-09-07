/** Gemeinsame Helfer der Diagramme — bewusst ohne Chart-Bibliothek:
 *  vier einfache SVG-Darstellungen wiegen weniger als eine Abhaengigkeit. */

export const skalieren = (wert, [vonMin, vonMax], [zuMin, zuMax]) => {
  if (vonMax === vonMin) return (zuMin + zuMax) / 2
  return zuMin + ((wert - vonMin) / (vonMax - vonMin)) * (zuMax - zuMin)
}

/** Punkte zu einem weichen Pfad verbinden (Catmull-Rom, als Bezier ausgegeben) */
export function weicherPfad(punkte) {
  if (punkte.length < 2) return punkte.length ? `M${punkte[0].x},${punkte[0].y}` : ''
  let d = `M${punkte[0].x},${punkte[0].y}`
  for (let i = 0; i < punkte.length - 1; i++) {
    const p0 = punkte[i - 1] || punkte[i]
    const p1 = punkte[i]
    const p2 = punkte[i + 1]
    const p3 = punkte[i + 2] || p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`
  }
  return d
}

/** Farbverlauf zwischen zwei Hex-Farben */
export function farbeZwischen(von, bis, anteil) {
  const a = hexZuRgb(von)
  const b = hexZuRgb(bis)
  const t = Math.max(0, Math.min(1, anteil))
  const m = a.map((x, i) => Math.round(x + (b[i] - x) * t))
  return `rgb(${m.join(',')})`
}

function hexZuRgb(hex) {
  const h = hex.replace('#', '')
  const voll = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [0, 2, 4].map((i) => parseInt(voll.slice(i, i + 2), 16))
}
