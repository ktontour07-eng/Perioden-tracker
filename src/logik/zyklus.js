/**
 * Zyklusrechnung.
 *
 * Grundsatz (Briefing 3.1): Ein Zyklus ist ein eigenes Objekt, keine Differenz
 * zweier Periodenstarts. Ausgebliebene oder unklare Zyklen bleiben sichtbar,
 * gehen aber nicht in Median und Prognose ein.
 *
 * Alle Funktionen hier sind rein — sie kennen weder Datenbank noch React.
 */

import { REGELN, ZYKLUS_STATUS } from '../config/kategorien.js'
import { heute as heuteISO, plusTage, tageDazwischen } from './datum.js'
import { median, perzentil } from './statistik.js'

/* ------------------------------------------------------------------ */
/* Status                                                              */
/* ------------------------------------------------------------------ */

/** Automatischer Status aus der Laenge. Nur fuer abgeschlossene Zyklen. */
export function statusFuerLaenge(laenge) {
  if (laenge === null || laenge === undefined) return 'unklar'
  if (laenge < REGELN.minNormal) return 'unklar'
  if (laenge <= REGELN.maxNormal) return 'normal'
  if (laenge <= REGELN.maxLang) return 'lang'
  return 'ausgeblieben'
}

export function statistikStandard(status) {
  return ZYKLUS_STATUS[status]?.inStatistik ?? false
}

/* ------------------------------------------------------------------ */
/* Aufbereitete Zyklusliste                                            */
/* ------------------------------------------------------------------ */

/**
 * Sortiert die Zyklen, ergaenzt Laenge, Status und Statistikflag.
 * Manuell gesetzte Werte (`statusManuell`, `inStatistikManuell`) gewinnen
 * immer gegen die Automatik.
 */
export function aufbereiteteZyklen(zyklen, bezugsdatum = heuteISO()) {
  const sortiert = [...(zyklen || [])].sort((a, b) => a.startDate.localeCompare(b.startDate))
  return sortiert.map((z, i) => {
    const naechster = sortiert[i + 1] || null
    const laufend = !naechster
    const laenge = naechster ? tageDazwischen(z.startDate, naechster.startDate) : null
    const bisherigeTage = laufend ? tageDazwischen(z.startDate, bezugsdatum) + 1 : null
    const status = z.statusManuell ? z.status : laufend ? z.status || 'normal' : statusFuerLaenge(laenge)
    const inStatistik = z.inStatistikManuell
      ? !!z.inStatistik
      : laufend
        ? false // ein laufender Zyklus hat noch keine Laenge
        : statistikStandard(status)
    const mensTage = z.endDate ? tageDazwischen(z.startDate, z.endDate) + 1 : null
    return {
      ...z,
      status,
      inStatistik,
      laenge,
      laufend,
      bisherigeTage,
      mensTage,
      naechsterStart: naechster ? naechster.startDate : null,
    }
  })
}

/** Nur abgeschlossene Zyklen, die in Median und Prognose einfliessen duerfen. */
export function statistikZyklen(aufbereitet) {
  return aufbereitet.filter((z) => !z.laufend && z.inStatistik && typeof z.laenge === 'number')
}

/* ------------------------------------------------------------------ */
/* Prognose                                                            */
/* ------------------------------------------------------------------ */

/**
 * Prognose fuer genau einen Zyklus im Voraus (Briefing 6.1).
 * Ergebnis ist ein Fenster aus den Perzentilen der letzten Zyklen,
 * kein einzelnes Datum.
 */
export function prognose(aufbereitet, laufenderStart = null) {
  const basis = statistikZyklen(aufbereitet).slice(-REGELN.prognoseFenster)
  const laengen = basis.map((z) => z.laenge)
  const hatDaten = laengen.length > 0
  const medianLaenge = hatDaten ? Math.round(median(laengen)) : REGELN.fallbackZykluslaenge

  let von = medianLaenge
  let bis = medianLaenge
  if (laengen.length >= 3) {
    von = Math.floor(perzentil(laengen, 0.25))
    bis = Math.ceil(perzentil(laengen, 0.75))
  } else if (laengen.length > 0) {
    von = Math.min(...laengen)
    bis = Math.max(...laengen)
  }
  // Ein Fenster von null Tagen wuerde wieder Scheingenauigkeit vortaeuschen.
  if (bis - von < 2) {
    von = medianLaenge - 1
    bis = medianLaenge + 1
  }

  const start = laufenderStart
  return {
    anzahlBasis: laengen.length,
    genug: laengen.length > 0,
    medianLaenge,
    kuerzeste: hatDaten ? Math.min(...laengen) : null,
    laengste: hatDaten ? Math.max(...laengen) : null,
    fensterTage: [von, bis],
    // konkrete Daten, wenn ein laufender Zyklus bekannt ist
    erwarteterStart: start ? plusTage(start, medianLaenge) : null,
    fensterVon: start ? plusTage(start, von) : null,
    fensterBis: start ? plusTage(start, bis) : null,
    eisprungGeschaetzt: start ? plusTage(start, medianLaenge - REGELN.lutealTage) : null,
  }
}

/* ------------------------------------------------------------------ */
/* Phasen                                                              */
/* ------------------------------------------------------------------ */

/**
 * Phase eines Zyklustags (1-basiert).
 * `laenge`   — Gesamtlaenge des Zyklus (bei laufenden: Prognose-Median)
 * `mensTage` — Anzahl Blutungstage am Zyklusanfang
 */
export function phaseFuerZyklustag(tag, laenge, mensTage = 5) {
  if (!laenge || tag < 1) return 'unbekannt'
  const mens = Math.max(1, Math.min(mensTage || 5, laenge))
  if (tag <= mens) return 'menstruation'
  const eisprungTag = laenge - REGELN.lutealTage
  if (eisprungTag <= mens) {
    // Sehr kurzer Zyklus: keine sinnvolle Follikelphase mehr uebrig.
    return tag > eisprungTag ? 'luteal' : 'follikel'
  }
  if (tag === eisprungTag) return 'eisprung'
  if (tag < eisprungTag) return 'follikel'
  return 'luteal'
}

/**
 * Rueckwaerts gezaehlter Zyklustag (Briefing 7.1): -1 ist der letzte Tag vor
 * dem naechsten Periodenstart, -2 der vorletzte usw.
 */
export function tagRueckwaerts(tag, laenge) {
  if (!laenge || !tag) return null
  return tag - laenge - 1
}

/* ------------------------------------------------------------------ */
/* Aktueller Stand                                                     */
/* ------------------------------------------------------------------ */

/**
 * Alles, was der Heute-Bildschirm ueber den aktuellen Zyklus wissen muss —
 * inklusive Wartemodus (Briefing 6.3).
 */
export function aktuellerStand(aufbereitet, bezugsdatum = heuteISO()) {
  const laufender = aufbereitet.find((z) => z.laufend) || null
  const p = prognose(aufbereitet, laufender ? laufender.startDate : null)

  if (!laufender) {
    return {
      zyklus: null,
      zyklustag: null,
      phase: 'unbekannt',
      prognose: p,
      ueberfaellig: false,
      ueberfaelligTage: 0,
      wartemodus: false,
      keineDaten: true,
    }
  }

  const zyklustag = tageDazwischen(laufender.startDate, bezugsdatum) + 1
  const schwelle = Math.max(p.medianLaenge + REGELN.ueberfaelligPuffer, REGELN.ueberfaelligFruehestensTag)
  const ueberfaellig = zyklustag > schwelle
  const ueberfaelligTage = Math.max(0, zyklustag - p.medianLaenge)
  // Wartemodus auch, wenn der laufende Zyklus manuell als unklar/ausgeblieben
  // markiert wurde: dann ist die Position im Zyklus ebenfalls unbekannt.
  const statusUnklar = laufender.statusManuell && ['unklar', 'ausgeblieben'].includes(laufender.status)
  const wartemodus = ueberfaellig || statusUnklar

  const phase = wartemodus
    ? 'unbekannt'
    : phaseFuerZyklustag(zyklustag, p.medianLaenge, laufender.mensTage || 5)

  return {
    zyklus: laufender,
    zyklustag,
    phase,
    prognose: p,
    ueberfaellig,
    ueberfaelligTage,
    wartemodus,
    keineDaten: false,
  }
}

/* ------------------------------------------------------------------ */
/* Aerztlicher Hinweis                                                 */
/* ------------------------------------------------------------------ */

/**
 * Drei ausgebliebene Zyklen in Folge oder ueber 90 Tage ohne Blutung.
 * Wird in der Oberflaeche nur einmal gezeigt (Quittierung in den Settings).
 */
export function arztHinweisNoetig(aufbereitet, bezugsdatum = heuteISO()) {
  const abgeschlossen = aufbereitet.filter((z) => !z.laufend)
  const letzte = abgeschlossen.slice(-REGELN.arztHinweisAusgeblieben)
  const dreiInFolge =
    letzte.length === REGELN.arztHinweisAusgeblieben &&
    letzte.every((z) => z.status === 'ausgeblieben' || z.status === 'unklar')

  const letzterStart = aufbereitet.length ? aufbereitet[aufbereitet.length - 1].startDate : null
  const tageOhneBlutung = letzterStart ? tageDazwischen(letzterStart, bezugsdatum) : 0
  const langeOhne = tageOhneBlutung > REGELN.arztHinweisTageOhneBlutung

  return {
    noetig: dreiInFolge || langeOhne,
    grund: dreiInFolge ? 'drei-ausgeblieben' : langeOhne ? 'lange-ohne-blutung' : null,
    tageOhneBlutung,
  }
}

/* ------------------------------------------------------------------ */
/* Zyklen aus Tageseintraegen ableiten                                 */
/* ------------------------------------------------------------------ */

/**
 * Schlaegt aus den Blutungseintraegen Zyklusstarts und Blutungsenden vor.
 * Erzeugt nie selbst Datensaetze — der Aufrufer entscheidet, was gespeichert
 * wird. Manuell angelegte Zyklen bleiben unangetastet.
 *
 * Regel: Ein Tag mit Blutung >= `minBlutungFuerStart` beginnt einen neuen
 * Zyklus, wenn seit dem letzten Zyklusstart mindestens `minAbstandNeuerZyklus`
 * Tage vergangen sind. Schmierblutung allein startet nichts.
 */
export function zyklusVorschlaege(eintraege, zyklen) {
  const blutungsTage = (eintraege || [])
    .filter((e) => (e.blutung || 0) >= 1)
    .map((e) => ({ date: e.date, blutung: e.blutung }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const vorhandene = [...(zyklen || [])].sort((a, b) => a.startDate.localeCompare(b.startDate))
  const starts = vorhandene.map((z) => z.startDate)
  const neueStarts = []

  for (const tag of blutungsTage) {
    if (tag.blutung < REGELN.minBlutungFuerStart) continue
    const alle = [...starts, ...neueStarts].sort()
    const letzter = alle.filter((s) => s <= tag.date).pop()
    if (letzter && tageDazwischen(letzter, tag.date) < REGELN.minAbstandNeuerZyklus) continue
    if (alle.includes(tag.date)) continue
    neueStarts.push(tag.date)
  }

  // Blutungsende je Zyklus: letzter zusammenhaengender Blutungstag ab Start.
  const alleStarts = [...starts, ...neueStarts].sort()
  const enden = {}
  for (const start of alleStarts) {
    const naechster = alleStarts.find((s) => s > start)
    let ende = start
    let d = start
    let luecke = 0
    while (true) {
      const naechsterTag = plusTage(d, 1)
      if (naechster && naechsterTag >= naechster) break
      const eintrag = blutungsTage.find((b) => b.date === naechsterTag)
      if (eintrag) {
        ende = naechsterTag
        luecke = 0
      } else {
        luecke += 1
        if (luecke > 1) break // ein Tag Pause wird noch als eine Blutung gewertet
      }
      d = naechsterTag
      if (tageDazwischen(start, d) > 14) break
    }
    enden[start] = ende
  }

  return {
    neueStarts,
    enden,
    aenderungen: vorhandene
      .filter((z) => enden[z.startDate] && z.endDate !== enden[z.startDate] && !z.endeManuell)
      .map((z) => ({ id: z.id, endDate: enden[z.startDate] })),
  }
}

/** Findet den Zyklus, in den ein Datum faellt. */
export function zyklusFuerDatum(aufbereitet, datum) {
  for (let i = aufbereitet.length - 1; i >= 0; i--) {
    const z = aufbereitet[i]
    if (datum >= z.startDate && (!z.naechsterStart || datum < z.naechsterStart)) return z
  }
  return null
}
