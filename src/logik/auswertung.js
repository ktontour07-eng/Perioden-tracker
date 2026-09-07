/**
 * Auswertung: Phasenzuordnung, Overlay, Phasen-Statistik, Heatmap,
 * Tag-Haeufigkeiten, Muster ueber die Zeit.
 *
 * Zaehlweise (Briefing 7.1): rueckwaerts ab dem naechsten Periodenstart ist
 * fuer Symptome die aussagekraeftigere Achse, weil die Lutealphase relativ
 * konstant ist. Zusaetzlich gibt es die auf 0–100 % normalisierte Achse fuer
 * Overlays. Vorwaerts zaehlen verwischt genau die Muster, um die es geht.
 */

import { REGELN, TAG_KATEGORIEN, tagKey } from '../config/kategorien.js'
import { tageDazwischen, plusTage } from './datum.js'
import { median, mittelwert, perzentil, standardabweichung, runde } from './statistik.js'
import { phaseFuerZyklustag, tagRueckwaerts } from './zyklus.js'

/**
 * Baut je Zyklus die Tagesliste mit Phase, Zyklustag, Rueckwaertstag und
 * Prozentposition. Nur abgeschlossene Zyklen, die in die Statistik duerfen —
 * bei ausgebliebenen Zyklen ist die Phasenzuordnung nicht definiert.
 */
export function zyklusDaten(aufbereitet, eintraege) {
  const nachDatum = new Map((eintraege || []).map((e) => [e.date, e]))
  return aufbereitet
    .filter((z) => !z.laufend && z.inStatistik && z.laenge >= REGELN.minNormal)
    .map((z) => {
      const tage = []
      for (let i = 1; i <= z.laenge; i++) {
        const datum = plusTage(z.startDate, i - 1)
        tage.push({
          datum,
          tag: i,
          rueckwaerts: tagRueckwaerts(i, z.laenge),
          prozent: ((i - 1) / (z.laenge - 1)) * 100,
          phase: phaseFuerZyklustag(i, z.laenge, z.mensTage || 5),
          eintrag: nachDatum.get(datum) || null,
        })
      }
      return { zyklus: z, tage }
    })
}

/** Wie viele auswertbare Zyklen liegen vor, und wie viele fehlen noch? */
export function datenlage(aufbereitet) {
  const nutzbar = aufbereitet.filter((z) => !z.laufend && z.inStatistik).length
  return {
    nutzbar,
    genug: nutzbar >= REGELN.minZyklenFuerAuswertung,
    fehlend: Math.max(0, REGELN.minZyklenFuerAuswertung - nutzbar),
  }
}

/* ------------------------------------------------------------------ */
/* Overlay-Linien                                                      */
/* ------------------------------------------------------------------ */

/**
 * Eine Linie je Zyklus.
 * modus: 'prozent'      — x = 0..100 (Zyklus normalisiert)
 *        'rueckwaerts'  — x = -laenge..-1 (ab naechstem Periodenstart)
 */
export function overlaySerien(daten, feld, modus = 'prozent') {
  return daten.map(({ zyklus, tage }) => ({
    id: zyklus.id,
    start: zyklus.startDate,
    laenge: zyklus.laenge,
    punkte: tage
      .filter((t) => t.eintrag && typeof t.eintrag[feld] === 'number')
      .map((t) => ({
        x: modus === 'rueckwaerts' ? t.rueckwaerts : t.prozent,
        y: t.eintrag[feld],
        datum: t.datum,
        phase: t.phase,
      })),
  }))
}

/** Mittlere Kurve ueber alle Zyklen, in Klassen zusammengefasst. */
export function mittelKurve(serien, modus = 'prozent', klassen = 20) {
  const alle = serien.flatMap((s) => s.punkte)
  if (!alle.length) return []
  const xs = alle.map((p) => p.x)
  const min = Math.min(...xs)
  const max = Math.max(...xs)
  const breite = (max - min) / klassen || 1
  const eimer = Array.from({ length: klassen }, () => [])
  for (const p of alle) {
    const i = Math.min(klassen - 1, Math.floor((p.x - min) / breite))
    eimer[i].push(p.y)
  }
  return eimer
    .map((werte, i) => ({
      x: min + breite * (i + 0.5),
      y: mittelwert(werte),
      n: werte.length,
    }))
    .filter((p) => p.y !== null)
}

/* ------------------------------------------------------------------ */
/* Phasen-Statistik (Balken mit Streuung)                              */
/* ------------------------------------------------------------------ */

/**
 * Je Phase: Median, Quartile und Spanne einer Skala.
 * Ohne Streuung wuerde eine Praezision suggeriert, die die Daten nicht
 * hergeben (Briefing 7.2).
 */
export function phasenStatistik(daten, feld) {
  const nachPhase = { menstruation: [], follikel: [], eisprung: [], luteal: [] }
  for (const { tage } of daten) {
    for (const t of tage) {
      const wert = t.eintrag?.[feld]
      if (typeof wert === 'number' && nachPhase[t.phase]) nachPhase[t.phase].push(wert)
    }
  }
  return Object.entries(nachPhase).map(([phase, werte]) => ({
    phase,
    n: werte.length,
    median: runde(median(werte), 2),
    mittel: runde(mittelwert(werte), 2),
    p25: runde(perzentil(werte, 0.25), 2),
    p75: runde(perzentil(werte, 0.75), 2),
    min: werte.length ? Math.min(...werte) : null,
    max: werte.length ? Math.max(...werte) : null,
  }))
}

/* ------------------------------------------------------------------ */
/* Heatmap                                                             */
/* ------------------------------------------------------------------ */

/** Zeilen = Zyklen, Spalten = Zyklustage, Wert = Skala des Tages. */
export function heatmapDaten(daten, feld) {
  const maxTage = Math.max(0, ...daten.map((d) => d.zyklus.laenge))
  return {
    maxTage,
    zeilen: daten.map(({ zyklus, tage }) => ({
      id: zyklus.id,
      start: zyklus.startDate,
      laenge: zyklus.laenge,
      werte: Array.from({ length: maxTage }, (_, i) => {
        const t = tage[i]
        if (!t) return null
        const wert = t.eintrag?.[feld]
        return typeof wert === 'number' ? { wert, phase: t.phase, datum: t.datum } : null
      }),
    })),
  }
}

/* ------------------------------------------------------------------ */
/* Tag-Haeufigkeiten                                                   */
/* ------------------------------------------------------------------ */

/**
 * Je Tag: an wie viel Prozent der Tage einer Phase wurde es getippt.
 * Gezaehlt werden nur Tage mit irgendeinem Eintrag — sonst wuerden Luecken
 * als „Symptom nicht vorhanden“ gewertet.
 */
export function tagHaeufigkeiten(daten, kategorieId) {
  const kategorie = TAG_KATEGORIEN.find((k) => k.id === kategorieId)
  if (!kategorie) return { kategorie: null, phasen: [], zeilen: [] }

  const phasen = ['menstruation', 'follikel', 'luteal']
  const nenner = Object.fromEntries(phasen.map((p) => [p, 0]))
  const zaehler = {}

  for (const { tage } of daten) {
    for (const t of tage) {
      const phase = t.phase === 'eisprung' ? 'follikel' : t.phase
      if (!phasen.includes(phase)) continue
      if (!t.eintrag || !istBefuellt(t.eintrag)) continue
      nenner[phase] += 1
      const gewaehlt = t.eintrag[kategorie.feld] || []
      for (const tagId of gewaehlt) {
        zaehler[tagId] = zaehler[tagId] || Object.fromEntries(phasen.map((p) => [p, 0]))
        zaehler[tagId][phase] += 1
      }
    }
  }

  const zeilen = kategorie.optionen
    .map((opt) => {
      const z = zaehler[opt.id] || Object.fromEntries(phasen.map((p) => [p, 0]))
      const werte = Object.fromEntries(
        phasen.map((p) => [p, nenner[p] ? (z[p] / nenner[p]) * 100 : null]),
      )
      return {
        key: tagKey(kategorieId, opt.id),
        option: opt,
        anzahl: phasen.reduce((s, p) => s + z[p], 0),
        werte,
        unterschied:
          werte.luteal !== null && werte.follikel !== null
            ? werte.luteal - werte.follikel
            : null,
      }
    })
    .filter((z) => z.anzahl > 0)
    .sort((a, b) => Math.abs(b.unterschied ?? 0) - Math.abs(a.unterschied ?? 0))

  return { kategorie, phasen, nenner, zeilen }
}

/** Hat der Tag ueberhaupt Inhalt? Leere Tage duerfen nicht als „nein“ zaehlen. */
export function istBefuellt(e) {
  if (!e) return false
  if (typeof e.blutung === 'number' || typeof e.stimmung === 'number' || typeof e.energie === 'number')
    return true
  const listen = ['gefuehle', 'geist', 'haut', 'sozial', 'ausfluss', 'medikamente']
  if (listen.some((f) => (e[f] || []).length)) return true
  if ((e.schmerzen || []).length) return true
  if (e.sex && (e.sex.aktivitaet || e.sex.verhuetung || e.sex.libido)) return true
  return !!(e.notiz && e.notiz.trim())
}

/* ------------------------------------------------------------------ */
/* Schmerzen                                                           */
/* ------------------------------------------------------------------ */

/** Je Region: Haeufigkeit und mittlere Intensitaet pro Phase. */
export function schmerzStatistik(daten) {
  const phasen = ['menstruation', 'follikel', 'luteal']
  const nenner = Object.fromEntries(phasen.map((p) => [p, 0]))
  const proRegion = {}
  for (const { tage } of daten) {
    for (const t of tage) {
      const phase = t.phase === 'eisprung' ? 'follikel' : t.phase
      if (!phasen.includes(phase) || !t.eintrag || !istBefuellt(t.eintrag)) continue
      nenner[phase] += 1
      for (const s of t.eintrag.schmerzen || []) {
        proRegion[s.region] = proRegion[s.region] || {
          region: s.region,
          tage: Object.fromEntries(phasen.map((p) => [p, 0])),
          intensitaeten: [],
        }
        proRegion[s.region].tage[phase] += 1
        proRegion[s.region].intensitaeten.push(s.intensitaet)
      }
    }
  }
  return Object.values(proRegion)
    .map((r) => ({
      ...r,
      anteil: Object.fromEntries(
        phasen.map((p) => [p, nenner[p] ? (r.tage[p] / nenner[p]) * 100 : null]),
      ),
      mittlereIntensitaet: runde(mittelwert(r.intensitaeten), 1),
      gesamt: phasen.reduce((s, p) => s + r.tage[p], 0),
    }))
    .sort((a, b) => b.gesamt - a.gesamt)
}

/* ------------------------------------------------------------------ */
/* Muster ueber die Zeit                                               */
/* ------------------------------------------------------------------ */

/**
 * Ausgebliebene Zyklen sind echte Datenpunkte (Briefing 7.5): wie oft im
 * letzten Jahr, und wird die Streuung groesser?
 */
export function musterUeberZeit(aufbereitet, bezugsdatum) {
  const abgeschlossen = aufbereitet.filter((z) => !z.laufend)
  const letztesJahr = abgeschlossen.filter(
    (z) => tageDazwischen(z.startDate, bezugsdatum) <= 365,
  )
  const laengen = abgeschlossen.filter((z) => z.inStatistik).map((z) => z.laenge)
  const haelfte = Math.floor(laengen.length / 2)
  const frueh = laengen.slice(0, haelfte)
  const spaet = laengen.slice(laengen.length - haelfte)

  return {
    gesamt: abgeschlossen.length,
    letztesJahr: letztesJahr.length,
    ausgebliebenLetztesJahr: letztesJahr.filter((z) => z.status === 'ausgeblieben').length,
    unklarLetztesJahr: letztesJahr.filter((z) => z.status === 'unklar').length,
    langLetztesJahr: letztesJahr.filter((z) => z.status === 'lang').length,
    medianLaenge: laengen.length ? runde(median(laengen), 1) : null,
    streuung: laengen.length > 1 ? runde(standardabweichung(laengen), 1) : null,
    streuungFrueh: frueh.length > 1 ? runde(standardabweichung(frueh), 1) : null,
    streuungSpaet: spaet.length > 1 ? runde(standardabweichung(spaet), 1) : null,
    kuerzeste: laengen.length ? Math.min(...laengen) : null,
    laengste: laengen.length ? Math.max(...laengen) : null,
  }
}

/**
 * Kontext fuer die Sprueche: was wurde in den letzten Tagen eingetragen?
 */
export function spruchKontext(eintraege, bezugsdatum, tage = 3) {
  const relevant = (eintraege || [])
    .filter((e) => {
      const d = tageDazwischen(e.date, bezugsdatum)
      return d >= 0 && d < tage
    })
    .sort((a, b) => b.date.localeCompare(a.date))

  const tagZaehler = {}
  for (const e of relevant) {
    for (const k of TAG_KATEGORIEN) {
      for (const id of e[k.feld] || []) {
        const key = tagKey(k.id, id)
        tagZaehler[key] = (tagZaehler[key] || 0) + 1
      }
    }
  }
  const woche = (eintraege || []).filter((e) => {
    const d = tageDazwischen(e.date, bezugsdatum)
    return d >= 0 && d < 7
  })

  return {
    tagZaehler,
    letzteStimmung: relevant[0]?.stimmung ?? null,
    letzteEnergie: relevant[0]?.energie ?? null,
    stimmungSchnitt3: mittelwert(relevant.map((e) => e.stimmung).filter((x) => typeof x === 'number')),
    schmerzTage7: woche.filter((e) => (e.schmerzen || []).length).length,
  }
}

/** Meistgenutzte Tags — Grundlage der Schnellansicht. */
export function meistgenutzteTags(eintraege, anzahl = 8) {
  const zaehler = {}
  for (const e of eintraege || []) {
    for (const k of TAG_KATEGORIEN) {
      for (const id of e[k.feld] || []) {
        const key = tagKey(k.id, id)
        zaehler[key] = (zaehler[key] || 0) + 1
      }
    }
  }
  return Object.entries(zaehler)
    .sort((a, b) => b[1] - a[1])
    .slice(0, anzahl)
    .map(([key, n]) => ({ key, anzahl: n }))
}
