/**
 * Eigene Anpassungen an den Tag-Listen (Briefing 10: die Wortlisten werden
 * nach den ersten Wochen mehrfach angepasst — das soll ohne Rechner gehen).
 *
 * Grundsatz: Die Vergangenheit bleibt lesbar. Ein Tag wird beim „Löschen“
 * standardmaessig nur aus der Eingabe genommen; die bereits erfassten Tage
 * behalten ihn, damit die Auswertung nicht rueckwirkend luegt. Wer ihn wirklich
 * aus allen Eintraegen entfernen will, muss das eigens bestaetigen.
 *
 * Umbenennen aendert nur das Wort, nie die ID — deshalb bleiben alte Eintraege
 * unter dem neuen Namen sichtbar.
 */

import { STANDARD_TAG_ICON, TAG_KATEGORIEN, tagKey } from '../config/kategorien.js'

export const LEERE_ANPASSUNGEN = { versteckt: [], umbenannt: {}, eigene: {} }

export function anpassungen(einstellungen) {
  const a = einstellungen?.tagAnpassungen || {}
  return {
    versteckt: a.versteckt || [],
    umbenannt: a.umbenannt || {},
    eigene: a.eigene || {},
  }
}

/**
 * Alle Optionen einer Kategorie inklusive der versteckten — fuer die
 * Verwaltung in den Einstellungen.
 */
export function alleOptionen(kategorie, einstellungen) {
  const a = anpassungen(einstellungen)
  const eigene = (a.eigene[kategorie.id] || []).map((o) => ({ ...o, eigen: true }))
  return [...(kategorie.optionen || []), ...eigene].map((o) => {
    const key = tagKey(kategorie.id, o.id)
    const neu = a.umbenannt[key]
    return {
      ...o,
      ...(neu ? { wort: neu.wort ?? o.wort, icon: neu.icon ?? o.icon } : {}),
      key,
      eigen: !!o.eigen,
      versteckt: a.versteckt.includes(key),
      umbenannt: !!neu,
      originalWort: o.wort,
    }
  })
}

/**
 * Die Optionen, die im Tageseintrag erscheinen.
 * `zusaetzlich` haelt versteckte Tags sichtbar, die an diesem Tag gesetzt sind —
 * sonst liesse sich ein Eintrag nicht mehr zuruecknehmen.
 */
export function sichtbareOptionen(kategorie, einstellungen, zusaetzlich = []) {
  return alleOptionen(kategorie, einstellungen).filter(
    (o) => !o.versteckt || zusaetzlich.includes(o.id),
  )
}

/** Flache Liste aller Tags — Grundlage der Favoritenauswahl. */
export function alleTagsFlach(einstellungen, { mitVersteckten = false } = {}) {
  return TAG_KATEGORIEN.flatMap((k) =>
    alleOptionen(k, einstellungen)
      .filter((o) => mitVersteckten || !o.versteckt)
      .map((option) => ({ key: option.key, kategorie: k, option })),
  )
}

/** Auflösung eines Tag-Schluessels mit angewendeten Anpassungen. */
export function tagInfoAngepasst(key, einstellungen) {
  const [katId, tagId] = String(key).split(':')
  const kategorie = TAG_KATEGORIEN.find((k) => k.id === katId)
  if (!kategorie) return null
  const option = alleOptionen(kategorie, einstellungen).find((o) => o.id === tagId)
  return option ? { kategorie, option, key } : null
}

/** Neuen Tag anlegen — ID aus dem Wort, damit sie in Exporten lesbar bleibt. */
export function neuerTag(wort, icon = STANDARD_TAG_ICON, vorhandeneIds = []) {
  const basis =
    'eigen-' +
    (wort || '')
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 24)
  let id = basis === 'eigen-' ? 'eigen-tag' : basis
  let n = 2
  while (vorhandeneIds.includes(id)) id = `${basis}-${n++}`
  return { id, wort: wort.trim(), icon: icon || STANDARD_TAG_ICON }
}

/* ------------------------------------------------------------------ */
/* Aenderungen auf die Einstellungen anwenden                          */
/* ------------------------------------------------------------------ */

export function mitVerstecktemTag(einstellungen, key, versteckt) {
  const a = anpassungen(einstellungen)
  return {
    tagAnpassungen: {
      ...a,
      versteckt: versteckt
        ? [...new Set([...a.versteckt, key])]
        : a.versteckt.filter((k) => k !== key),
    },
  }
}

export function mitUmbenanntemTag(einstellungen, key, { wort, icon }) {
  const a = anpassungen(einstellungen)
  return {
    tagAnpassungen: { ...a, umbenannt: { ...a.umbenannt, [key]: { wort, icon } } },
  }
}

export function ohneUmbenennung(einstellungen, key) {
  const a = anpassungen(einstellungen)
  const umbenannt = { ...a.umbenannt }
  delete umbenannt[key]
  return { tagAnpassungen: { ...a, umbenannt } }
}

export function mitNeuemTag(einstellungen, kategorieId, tag) {
  const a = anpassungen(einstellungen)
  return {
    tagAnpassungen: {
      ...a,
      eigene: { ...a.eigene, [kategorieId]: [...(a.eigene[kategorieId] || []), tag] },
    },
  }
}

/** Entfernt einen selbst angelegten Tag aus der Konfiguration. */
export function ohneEigenenTag(einstellungen, kategorieId, tagId) {
  const a = anpassungen(einstellungen)
  const key = tagKey(kategorieId, tagId)
  const umbenannt = { ...a.umbenannt }
  delete umbenannt[key]
  return {
    tagAnpassungen: {
      ...a,
      versteckt: a.versteckt.filter((k) => k !== key),
      umbenannt,
      eigene: {
        ...a.eigene,
        [kategorieId]: (a.eigene[kategorieId] || []).filter((o) => o.id !== tagId),
      },
    },
  }
}

/** Wie viele Tage wären von einem endgültigen Löschen betroffen? */
export function betroffeneTage(eintraege, kategorie, tagId) {
  return (eintraege || []).filter((e) => (e[kategorie.feld] || []).includes(tagId)).length
}
