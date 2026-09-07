/**
 * ZENTRALE KONFIGURATION
 * ----------------------
 * Alle Kategorien, Tags, Wortlisten, Farben und Icons stehen ausschliesslich
 * hier. Die Komponenten lesen diese Datei — sie enthalten selbst keine
 * Wortlisten. Wenn nach ein paar Wochen Nutzung Begriffe fehlen oder stoeren,
 * wird genau diese Datei angepasst.
 *
 * Icon: derzeit Emoji (Startpunkt laut Briefing 9.2). Wird spaeter durch
 * eigene Illustrationen ersetzt, dann aendert sich nur das Feld `icon`
 * bzw. es kommt ein Feld `bild` dazu — kein Komponentencode.
 */

/** Typen von Kategorien */
export const TYP = {
  SKALA: 'skala', // geordnet    -> Linie / Mittelwert
  TAGS: 'tags', // ungeordnet  -> Haeufigkeit
  SCHMERZ: 'schmerz', // strukturiert
  SEX: 'sex', // strukturiert, ausblendbar
  MEDIKAMENTE: 'medikamente', // vom Nutzer gepflegt
  NOTIZ: 'notiz',
}

/* ------------------------------------------------------------------ */
/* Skalen                                                              */
/* ------------------------------------------------------------------ */

export const BLUTUNG = [
  { wert: 0, wort: 'keine', icon: '⚪️', farbe: '#cfd3dc' },
  { wert: 1, wort: 'Schmierblutung', icon: '💧', farbe: '#e8b4bc' },
  { wert: 2, wort: 'leicht', icon: '🩸', farbe: '#d98a96' },
  { wert: 3, wort: 'mittel', icon: '🩸', farbe: '#c26473' },
  { wert: 4, wort: 'stark', icon: '🩸', farbe: '#a34455' },
]

export const STIMMUNG = [
  { wert: 1, wort: 'sehr schlecht', icon: '😞', farbe: '#8b7ea8' },
  { wert: 2, wort: 'schlecht', icon: '🙁', farbe: '#9d90b5' },
  { wert: 3, wort: 'mittel', icon: '😐', farbe: '#aea6c2' },
  { wert: 4, wort: 'gut', icon: '🙂', farbe: '#93b3a8' },
  { wert: 5, wort: 'sehr gut', icon: '😄', farbe: '#7aa694' },
]

export const ENERGIE = [
  { wert: 1, wort: 'energielos', icon: '🪫', farbe: '#9aa0ad' },
  { wert: 2, wort: 'müde', icon: '😴', farbe: '#a9b3bf' },
  { wert: 3, wort: 'okay', icon: '🙂', farbe: '#8fb3ae' },
  { wert: 4, wort: 'energiegeladen', icon: '⚡️', farbe: '#7aa694' },
]

/* ------------------------------------------------------------------ */
/* Tags                                                                */
/* ------------------------------------------------------------------ */

export const GEFUEHLE = [
  { id: 'stimmungsschwankungen', wort: 'Stimmungsschwankungen', icon: '🎢' },
  { id: 'kontrollverlust', wort: 'Kontrollverlust', icon: '🌀' },
  { id: 'gut', wort: 'gut', icon: '🌤' },
  { id: 'froehlich', wort: 'fröhlich', icon: '😊' },
  { id: 'traurig', wort: 'traurig', icon: '😢' },
  { id: 'sensibel', wort: 'sensibel', icon: '🫧' },
  { id: 'wuetend', wort: 'wütend', icon: '😠' },
  { id: 'selbstbewusst', wort: 'selbstbewusst', icon: '💪' },
  { id: 'reizbar', wort: 'reizbar', icon: '⚡️' },
  { id: 'unruhig', wort: 'unruhig', icon: '🌊' },
  { id: 'unsicher', wort: 'unsicher', icon: '🫥' },
  { id: 'dankbar', wort: 'dankbar', icon: '🤍' },
]

export const GEIST = [
  { id: 'vergesslich', wort: 'vergesslich', icon: '🧩' },
  { id: 'brainfog', wort: 'Brain Fog', icon: '🌫' },
  { id: 'gestresst', wort: 'gestresst', icon: '🎯' },
  { id: 'konzentriert', wort: 'konzentriert', icon: '🔍' },
  { id: 'motiviert', wort: 'motiviert', icon: '🚀' },
  { id: 'unmotiviert', wort: 'unmotiviert', icon: '🪨' },
  { id: 'klar', wort: 'klar', icon: '💎' },
  { id: 'ueberfordert', wort: 'überfordert', icon: '🌪' },
]

export const SOZIAL = [
  { id: 'gesellig', wort: 'gesellig', icon: '🎉' },
  { id: 'unterstuetzend', wort: 'unterstützend', icon: '🤝' },
  { id: 'streitlustig', wort: 'streitlustig', icon: '🔥' },
  { id: 'zurueckgezogen', wort: 'zurückgezogen', icon: '🚪' },
  { id: 'anhaenglich', wort: 'anhänglich', icon: '🧸' },
]

export const HAUT = [
  { id: 'gut', wort: 'gut', icon: '✨' },
  { id: 'pickel', wort: 'Pickel', icon: '🔴' },
  { id: 'trocken', wort: 'trocken', icon: '🍂' },
  { id: 'fettig', wort: 'fettig', icon: '💦' },
  { id: 'geroetet', wort: 'gerötet', icon: '🌸' },
  { id: 'empfindlich', wort: 'empfindlich', icon: '🫧' },
]

export const AUSFLUSS = [
  { id: 'keiner', wort: 'keiner', icon: '⚪️' },
  { id: 'cremig', wort: 'cremig', icon: '🥛' },
  { id: 'klebrig', wort: 'klebrig', icon: '🍯' },
  { id: 'waessrig', wort: 'wässrig', icon: '💧' },
  { id: 'eiweissartig', wort: 'eiweißartig', icon: '🥚' },
  { id: 'untypisch', wort: 'untypisch', icon: '❓' },
]

/* ------------------------------------------------------------------ */
/* Schmerzen (zweistufig: erst Region, dann Art + Intensitaet)         */
/* ------------------------------------------------------------------ */

export const SCHMERZ_REGIONEN = [
  { id: 'unterleib', wort: 'Unterleib', icon: '🌙' },
  { id: 'ruecken', wort: 'unterer Rücken', icon: '🦴' },
  { id: 'kopf', wort: 'Kopf', icon: '🧠' },
  { id: 'brust', wort: 'Brust', icon: '🫀' },
  { id: 'beine', wort: 'Beine', icon: '🦵' },
  { id: 'gelenke', wort: 'Gelenke', icon: '🦿' },
  { id: 'magendarm', wort: 'Magen/Darm', icon: '🌀' },
]

export const SCHMERZ_ARTEN = [
  { id: 'krampfartig', wort: 'krampfartig', icon: '🌀' },
  { id: 'stechend', wort: 'stechend', icon: '📍' },
  { id: 'ziehend', wort: 'ziehend', icon: '🪢' },
  { id: 'dumpf', wort: 'dumpf', icon: '🌫' },
  { id: 'brennend', wort: 'brennend', icon: '🔥' },
]

export const SCHMERZ_INTENSITAET = [
  { wert: 1, wort: 'leicht', icon: '·' },
  { wert: 2, wort: 'mittel', icon: '··' },
  { wert: 3, wort: 'stark', icon: '···' },
]

/* ------------------------------------------------------------------ */
/* Sexleben — getrennt: Aktivitaet / Verhuetung / Libido               */
/* ------------------------------------------------------------------ */

export const SEX_AKTIVITAET = [
  { id: 'keine', wort: 'keine', icon: '⚪️' },
  { id: 'solo', wort: 'solo', icon: '🌙' },
  { id: 'partner', wort: 'mit Partner:in', icon: '💞' },
]

export const SEX_VERHUETUNG = [
  { id: 'keine', wort: 'keine', icon: '⚪️' },
  { id: 'kondom', wort: 'Kondom', icon: '🛡' },
  { id: 'hormonell', wort: 'hormonell', icon: '💊' },
  { id: 'spirale', wort: 'Spirale', icon: '⚓️' },
  { id: 'andere', wort: 'andere', icon: '➕' },
]

export const SEX_LIBIDO = [
  { wert: 1, wort: 'niedrig', icon: '🌑' },
  { wert: 2, wort: 'mittel', icon: '🌓' },
  { wert: 3, wort: 'hoch', icon: '🌕' },
]

/* ------------------------------------------------------------------ */
/* Kategorien-Register                                                 */
/* ------------------------------------------------------------------ */

/**
 * Reihenfolge = Reihenfolge im Tageseintrag.
 * `feld`      = Feldname im DayEntry
 * `abschaltbar` = darf in den Einstellungen ausgeblendet werden
 */
export const KATEGORIEN = [
  {
    id: 'blutung',
    feld: 'blutung',
    titel: 'Blutung',
    typ: TYP.SKALA,
    optionen: BLUTUNG,
    farbe: '#c26473',
    abschaltbar: false,
    hinweis: 'Der erste Tag mit Blutung startet einen neuen Zyklus.',
  },
  {
    id: 'stimmung',
    feld: 'stimmung',
    titel: 'Stimmung',
    typ: TYP.SKALA,
    optionen: STIMMUNG,
    farbe: '#8b7ea8',
    abschaltbar: true,
    hinweis: 'Gesamtwert — die einzelnen Gefühle kommen darunter.',
  },
  {
    id: 'energie',
    feld: 'energie',
    titel: 'Energie',
    typ: TYP.SKALA,
    optionen: ENERGIE,
    farbe: '#5f8f86',
    abschaltbar: true,
  },
  {
    id: 'gefuehle',
    feld: 'gefuehle',
    titel: 'Gefühle',
    typ: TYP.TAGS,
    optionen: GEFUEHLE,
    farbe: '#8b7ea8',
    abschaltbar: true,
  },
  {
    id: 'geist',
    feld: 'geist',
    titel: 'Geist',
    typ: TYP.TAGS,
    optionen: GEIST,
    farbe: '#6f86a8',
    abschaltbar: true,
  },
  {
    id: 'sozial',
    feld: 'sozial',
    titel: 'Sozial',
    typ: TYP.TAGS,
    optionen: SOZIAL,
    farbe: '#a88b6f',
    abschaltbar: true,
  },
  {
    id: 'haut',
    feld: 'haut',
    titel: 'Haut',
    typ: TYP.TAGS,
    optionen: HAUT,
    farbe: '#c99a8b',
    abschaltbar: true,
  },
  {
    id: 'ausfluss',
    feld: 'ausfluss',
    titel: 'Ausfluss',
    typ: TYP.TAGS,
    optionen: AUSFLUSS,
    farbe: '#7ba3b5',
    abschaltbar: true,
  },
  {
    id: 'schmerzen',
    feld: 'schmerzen',
    titel: 'Schmerzen',
    typ: TYP.SCHMERZ,
    farbe: '#b5717b',
    abschaltbar: true,
  },
  {
    id: 'sex',
    feld: 'sex',
    titel: 'Sexleben',
    typ: TYP.SEX,
    farbe: '#a87e97',
    abschaltbar: true,
    standardSichtbar: true,
    hinweis: 'Lässt sich in den Einstellungen vollständig ausblenden.',
  },
  {
    id: 'medikamente',
    feld: 'medikamente',
    titel: 'Medikamente',
    typ: TYP.MEDIKAMENTE,
    farbe: '#7f8fa6',
    abschaltbar: true,
    hinweis: 'Präparate werden einmalig in den Einstellungen angelegt.',
  },
  {
    id: 'notiz',
    feld: 'notiz',
    titel: 'Notiz',
    typ: TYP.NOTIZ,
    farbe: '#8a8f98',
    abschaltbar: true,
  },
]

export const KATEGORIE_NACH_ID = Object.fromEntries(KATEGORIEN.map((k) => [k.id, k]))

/** Alle Tag-Kategorien (fuer Auswertung und Favoriten) */
export const TAG_KATEGORIEN = KATEGORIEN.filter((k) => k.typ === TYP.TAGS)

/** Alle Skalen-Kategorien (fuer Kurven und Mittelwerte) */
export const SKALEN_KATEGORIEN = KATEGORIEN.filter((k) => k.typ === TYP.SKALA)

/** Eindeutiger Schluessel eines Tags ueber alle Kategorien hinweg */
export const tagKey = (kategorieId, tagId) => `${kategorieId}:${tagId}`

export function tagInfo(key) {
  const [katId, tagId] = key.split(':')
  const kat = KATEGORIE_NACH_ID[katId]
  const opt = kat?.optionen?.find((o) => o.id === tagId)
  if (!kat || !opt) return null
  return { kategorie: kat, option: opt, key }
}

/** Alle Tags als flache Liste — Grundlage der Schnellansicht/Favoriten */
export const ALLE_TAGS = TAG_KATEGORIEN.flatMap((k) =>
  k.optionen.map((o) => ({ key: tagKey(k.id, o.id), kategorie: k, option: o })),
)

/** Vorbelegte Favoriten, bis eigene Nutzung genug Daten liefert */
export const STANDARD_FAVORITEN = [
  tagKey('gefuehle', 'gut'),
  tagKey('gefuehle', 'reizbar'),
  tagKey('gefuehle', 'traurig'),
  tagKey('geist', 'gestresst'),
  tagKey('geist', 'brainfog'),
  tagKey('haut', 'pickel'),
  tagKey('sozial', 'zurueckgezogen'),
  tagKey('ausfluss', 'cremig'),
]

/** Anzahl Chips in der Schnellansicht */
export const SCHNELLANSICHT_ANZAHL = 8

/* ------------------------------------------------------------------ */
/* Phasen                                                              */
/* ------------------------------------------------------------------ */

export const PHASEN = {
  menstruation: { id: 'menstruation', titel: 'Menstruation', kurz: 'Periode', farbe: '#c26473', hell: '#f6e3e6' },
  follikel: { id: 'follikel', titel: 'Follikelphase', kurz: 'Follikel', farbe: '#7aa694', hell: '#e2efea' },
  eisprung: { id: 'eisprung', titel: 'Eisprung (geschätzt)', kurz: 'Eisprung', farbe: '#d9a441', hell: '#f9efd9' },
  luteal: { id: 'luteal', titel: 'Lutealphase', kurz: 'Luteal', farbe: '#8b7ea8', hell: '#eae6f2' },
  unbekannt: { id: 'unbekannt', titel: 'unbekannt', kurz: 'unklar', farbe: '#9aa0ad', hell: '#eceef1' },
}

export const PHASEN_REIHENFOLGE = ['menstruation', 'follikel', 'eisprung', 'luteal']

/* ------------------------------------------------------------------ */
/* Zyklus-Status                                                       */
/* ------------------------------------------------------------------ */

export const ZYKLUS_STATUS = {
  normal: { id: 'normal', wort: 'normal', icon: '•', inStatistik: true },
  lang: { id: 'lang', wort: 'lang', icon: '⟶', inStatistik: true },
  ausgeblieben: { id: 'ausgeblieben', wort: 'ausgeblieben', icon: '○', inStatistik: false },
  unklar: { id: 'unklar', wort: 'unklar', icon: '?', inStatistik: false },
}

/* ------------------------------------------------------------------ */
/* Schwellenwerte der Zyklusrechnung                                   */
/* ------------------------------------------------------------------ */

export const REGELN = {
  /** Ein neuer Blutungstag startet erst nach so vielen Tagen einen neuen Zyklus */
  minAbstandNeuerZyklus: 12,
  /** Ab dieser Blutungsstaerke gilt ein Tag als Periodenstart (1 = Schmierblutung zaehlt nicht) */
  minBlutungFuerStart: 2,
  /** Lutealphase: Tage vor dem naechsten Periodenstart */
  lutealTage: 14,
  /** Zykluslaengen-Grenzen fuer die Statusvergabe */
  minNormal: 21,
  maxNormal: 35,
  maxLang: 45,
  /** Wartemodus ab: erwartete Laenge + X Tage, fruehestens ab Tag Y */
  ueberfaelligPuffer: 7,
  ueberfaelligFruehestensTag: 35,
  /** Prognose aus den letzten N Zyklen */
  prognoseFenster: 6,
  /** Auswertung erst ab so vielen vollstaendigen Zyklen */
  minZyklenFuerAuswertung: 3,
  /** Aerztlicher Hinweis */
  arztHinweisAusgeblieben: 3,
  arztHinweisTageOhneBlutung: 90,
  /** Standard-Zykluslaenge, solange keine eigenen Daten vorliegen */
  fallbackZykluslaenge: 28,
}
