import { describe, it, expect } from 'vitest'
import { TAG_KATEGORIEN, tagKey } from '../../config/kategorien.js'
import {
  alleOptionen,
  alleTagsFlach,
  betroffeneTage,
  mitNeuemTag,
  mitUmbenanntemTag,
  mitVerstecktemTag,
  neuerTag,
  ohneEigenenTag,
  ohneUmbenennung,
  tagInfoAngepasst,
} from '../tags.js'
import { zyklusDaten, tagHaeufigkeiten } from '../auswertung.js'
import { aufbereiteteZyklen } from '../zyklus.js'
import { plusTage } from '../datum.js'

const gefuehle = TAG_KATEGORIEN.find((k) => k.id === 'gefuehle')
const leer = { tagAnpassungen: { versteckt: [], umbenannt: {}, eigene: {} } }

describe('Tags anpassen', () => {
  it('liefert ohne Anpassungen genau die Konfiguration', () => {
    const optionen = alleOptionen(gefuehle, leer)
    expect(optionen).toHaveLength(gefuehle.optionen.length)
    expect(optionen.every((o) => !o.versteckt && !o.eigen)).toBe(true)
  })

  it('legt eigene Tags an, ohne IDs zu doppeln', () => {
    const t1 = neuerTag('Heisshunger', '🍫', [])
    const t2 = neuerTag('Heisshunger', '🍫', [t1.id])
    expect(t1.id).toBe('eigen-heisshunger')
    expect(t2.id).toBe('eigen-heisshunger-2')
    const e = { ...leer, ...mitNeuemTag(leer, 'gefuehle', t1) }
    const optionen = alleOptionen(gefuehle, e)
    expect(optionen.at(-1)).toMatchObject({ id: t1.id, wort: 'Heisshunger', eigen: true })
  })

  it('wandelt Umlaute in der ID um', () => {
    expect(neuerTag('Übelkeit', '🤒', []).id).toBe('eigen-uebelkeit')
    expect(neuerTag('Rückenschmerz', '🦴', []).id).toBe('eigen-rueckenschmerz')
  })

  it('benennt um, ohne die ID zu ändern', () => {
    const key = tagKey('gefuehle', 'reizbar')
    const e = { ...leer, ...mitUmbenanntemTag(leer, key, { wort: 'dünnhäutig', icon: '🫧' }) }
    const option = alleOptionen(gefuehle, e).find((o) => o.id === 'reizbar')
    expect(option.wort).toBe('dünnhäutig')
    expect(option.icon).toBe('🫧')
    expect(option.originalWort).toBe('reizbar')
    // ID unveraendert -> alte Eintraege bleiben zugeordnet
    expect(option.id).toBe('reizbar')

    const zurueck = { ...leer, ...ohneUmbenennung(e, key) }
    expect(alleOptionen(gefuehle, zurueck).find((o) => o.id === 'reizbar').wort).toBe('reizbar')
  })

  it('blendet Tags aus und wieder ein', () => {
    const key = tagKey('gefuehle', 'traurig')
    const e = { ...leer, ...mitVerstecktemTag(leer, key, true) }
    expect(alleOptionen(gefuehle, e).find((o) => o.id === 'traurig').versteckt).toBe(true)
    expect(alleTagsFlach(e).some((t) => t.key === key)).toBe(false)
    expect(alleTagsFlach(e, { mitVersteckten: true }).some((t) => t.key === key)).toBe(true)

    const zurueck = { ...leer, ...mitVerstecktemTag(e, key, false) }
    expect(alleOptionen(gefuehle, zurueck).find((o) => o.id === 'traurig').versteckt).toBe(false)
  })

  it('entfernt eigene Tags samt Umbenennung und Ausblendung', () => {
    const tag = neuerTag('Heisshunger', '🍫', [])
    let e = { ...leer, ...mitNeuemTag(leer, 'gefuehle', tag) }
    e = { ...e, ...mitUmbenanntemTag(e, tagKey('gefuehle', tag.id), { wort: 'Hunger', icon: '🍫' }) }
    e = { ...e, ...mitVerstecktemTag(e, tagKey('gefuehle', tag.id), true) }
    const weg = { ...e, ...ohneEigenenTag(e, 'gefuehle', tag.id) }
    expect(alleOptionen(gefuehle, weg).some((o) => o.id === tag.id)).toBe(false)
    expect(weg.tagAnpassungen.versteckt).toHaveLength(0)
    expect(Object.keys(weg.tagAnpassungen.umbenannt)).toHaveLength(0)
  })

  it('löst Schlüssel mit Anpassungen auf', () => {
    const key = tagKey('geist', 'brainfog')
    const e = { ...leer, ...mitUmbenanntemTag(leer, key, { wort: 'Watte im Kopf', icon: '🌫' }) }
    expect(tagInfoAngepasst(key, e).option.wort).toBe('Watte im Kopf')
    expect(tagInfoAngepasst('gibtsnicht:egal', e)).toBe(null)
  })

  it('zählt betroffene Tage vor dem endgültigen Löschen', () => {
    const eintraege = [
      { date: '2025-01-01', gefuehle: ['reizbar', 'gut'] },
      { date: '2025-01-02', gefuehle: ['gut'] },
      { date: '2025-01-03', gefuehle: ['reizbar'] },
    ]
    expect(betroffeneTage(eintraege, gefuehle, 'reizbar')).toBe(2)
    expect(betroffeneTage(eintraege, gefuehle, 'traurig')).toBe(0)
  })
})

describe('Auswertung mit angepassten Tags', () => {
  const zyklen = [
    { id: 1, startDate: '2025-01-01' },
    { id: 2, startDate: '2025-01-29' },
    { id: 3, startDate: '2025-02-26' },
    { id: 4, startDate: '2025-03-26' },
  ]
  const tag = neuerTag('Heisshunger', '🍫', [])
  const einstellungen = {
    ...leer,
    ...mitNeuemTag(leer, 'gefuehle', tag),
  }
  const eintraege = []
  for (const z of zyklen.slice(0, 3)) {
    for (let t = 1; t <= 28; t++) {
      eintraege.push({
        date: plusTage(z.startDate, t - 1),
        blutung: t <= 5 ? 3 : 0,
        stimmung: 3,
        gefuehle: t >= 22 ? [tag.id] : ['gut'],
      })
    }
  }
  const daten = zyklusDaten(aufbereiteteZyklen(zyklen, '2025-04-05'), eintraege)

  it('wertet selbst angelegte Tags aus', () => {
    const h = tagHaeufigkeiten(daten, 'gefuehle', alleOptionen(gefuehle, einstellungen))
    const zeile = h.zeilen.find((z) => z.option.id === tag.id)
    expect(zeile).toBeDefined()
    expect(zeile.option.wort).toBe('Heisshunger')
    expect(Math.round(zeile.werte.luteal)).toBeGreaterThan(0)
    expect(Math.round(zeile.werte.follikel)).toBe(0)
  })

  it('behält ausgeblendete Tags in der Auswertung', () => {
    const versteckt = { ...einstellungen, ...mitVerstecktemTag(einstellungen, tagKey('gefuehle', tag.id), true) }
    const h = tagHaeufigkeiten(daten, 'gefuehle', alleOptionen(gefuehle, versteckt))
    expect(h.zeilen.some((z) => z.option.id === tag.id)).toBe(true)
  })
})
