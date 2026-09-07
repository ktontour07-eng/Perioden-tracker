import { describe, it, expect } from 'vitest'
import { aufbereiteteZyklen } from '../zyklus.js'
import {
  zyklusDaten,
  datenlage,
  overlaySerien,
  phasenStatistik,
  heatmapDaten,
  tagHaeufigkeiten,
  musterUeberZeit,
  istBefuellt,
  spruchKontext,
  meistgenutzteTags,
} from '../auswertung.js'
import { plusTage } from '../datum.js'
import { testdatenErzeugen } from '../../db/testdaten.js'

const zyklen = [
  { id: 1, startDate: '2025-01-01', endDate: '2025-01-05' },
  { id: 2, startDate: '2025-01-29', endDate: '2025-02-02' },
  { id: 3, startDate: '2025-02-26', endDate: '2025-03-02' },
  { id: 4, startDate: '2025-03-26' },
]

/** Reizbar nur in der zweiten Zyklushaelfte, gut nur in der ersten. */
function eintraegeBauen() {
  const e = []
  for (const z of zyklen.slice(0, 3)) {
    for (let tag = 1; tag <= 28; tag++) {
      const luteal = tag >= 15
      e.push({
        date: plusTage(z.startDate, tag - 1),
        blutung: tag <= 5 ? 3 : 0,
        stimmung: luteal ? 2 : 4,
        energie: luteal ? 2 : 3,
        gefuehle: luteal ? ['reizbar'] : ['gut'],
        geist: [],
        haut: [],
        sozial: [],
        ausfluss: [],
        schmerzen: tag === 1 ? [{ region: 'unterleib', art: 'krampfartig', intensitaet: 3 }] : [],
        sex: {},
        medikamente: [],
      })
    }
  }
  return e
}

const auf = aufbereiteteZyklen(zyklen, '2025-04-05')
const daten = zyklusDaten(auf, eintraegeBauen())

describe('Datenlage', () => {
  it('gibt frei, sobald drei auswertbare Zyklen vorliegen', () => {
    expect(datenlage(auf).nutzbar).toBe(3)
    expect(datenlage(auf).genug).toBe(true)
    const wenig = aufbereiteteZyklen(zyklen.slice(0, 2), '2025-02-10')
    expect(datenlage(wenig).genug).toBe(false)
    expect(datenlage(wenig).fehlend).toBe(2)
  })
})

describe('Zyklusdaten', () => {
  it('nimmt nur abgeschlossene Zyklen mit Statistikflag', () => {
    expect(daten).toHaveLength(3)
    expect(daten[0].tage).toHaveLength(28)
  })

  it('haengt Phase, Prozentachse und Rueckwaertstag an jeden Tag', () => {
    const t = daten[0].tage
    expect(t[0].phase).toBe('menstruation')
    expect(t[0].prozent).toBe(0)
    expect(t[27].prozent).toBe(100)
    expect(t[27].rueckwaerts).toBe(-1)
    expect(t[13].phase).toBe('eisprung')
  })
})

describe('Overlay', () => {
  it('liefert je Zyklus eine Linie', () => {
    const serien = overlaySerien(daten, 'stimmung', 'prozent')
    expect(serien).toHaveLength(3)
    expect(serien[0].punkte[0].x).toBe(0)
    expect(serien[0].punkte.at(-1).x).toBe(100)
  })

  it('legt die Zyklen rueckwaerts buendig uebereinander', () => {
    const serien = overlaySerien(daten, 'stimmung', 'rueckwaerts')
    expect(serien.every((s) => s.punkte.at(-1).x === -1)).toBe(true)
  })
})

describe('Phasenstatistik', () => {
  const stat = phasenStatistik(daten, 'stimmung')
  const nach = (p) => stat.find((s) => s.phase === p)

  it('zeigt den Unterschied zwischen Follikel- und Lutealphase', () => {
    expect(nach('follikel').median).toBe(4)
    expect(nach('luteal').median).toBe(2)
  })

  it('liefert immer auch die Streuung', () => {
    for (const s of stat) {
      if (s.n > 0) {
        expect(s.p25).not.toBeNull()
        expect(s.p75).not.toBeNull()
      }
    }
  })
})

describe('Heatmap', () => {
  it('legt Zeilen je Zyklus und Spalten je Zyklustag an', () => {
    const hm = heatmapDaten(daten, 'energie')
    expect(hm.maxTage).toBe(28)
    expect(hm.zeilen).toHaveLength(3)
    expect(hm.zeilen[0].werte).toHaveLength(28)
    expect(hm.zeilen[0].werte[0].wert).toBe(3)
  })
})

describe('Tag-Haeufigkeiten', () => {
  const h = tagHaeufigkeiten(daten, 'gefuehle')

  it('rechnet in Prozent der Tage der jeweiligen Phase', () => {
    const reizbar = h.zeilen.find((z) => z.option.id === 'reizbar')
    expect(Math.round(reizbar.werte.luteal)).toBe(100)
    expect(Math.round(reizbar.werte.follikel)).toBe(0)
    expect(Math.round(reizbar.unterschied)).toBe(100)
  })

  it('sortiert nach dem groessten Phasenunterschied', () => {
    expect(['reizbar', 'gut']).toContain(h.zeilen[0].option.id)
  })

  it('zaehlt leere Tage nicht als Nein', () => {
    const luecken = zyklusDaten(auf, eintraegeBauen().filter((e) => !e.date.endsWith('20')))
    const h2 = tagHaeufigkeiten(luecken, 'gefuehle')
    const reizbar = h2.zeilen.find((z) => z.option.id === 'reizbar')
    expect(Math.round(reizbar.werte.luteal)).toBe(100)
  })
})

describe('istBefuellt', () => {
  it('erkennt leere Tage', () => {
    expect(istBefuellt({ date: '2025-01-01', gefuehle: [], schmerzen: [], sex: {}, notiz: '' })).toBe(false)
    expect(istBefuellt({ date: '2025-01-01', blutung: 0 })).toBe(true)
    expect(istBefuellt({ date: '2025-01-01', gefuehle: ['gut'] })).toBe(true)
    expect(istBefuellt({ date: '2025-01-01', notiz: '   ' })).toBe(false)
  })
})

describe('Muster ueber die Zeit', () => {
  it('zaehlt ausgebliebene Zyklen als eigenen Datenpunkt', () => {
    const mitAusfall = aufbereiteteZyklen(
      [
        { id: 1, startDate: '2025-01-01' },
        { id: 2, startDate: '2025-01-29' },
        { id: 3, startDate: '2025-04-05' },
        { id: 4, startDate: '2025-05-03' },
      ],
      '2025-05-20',
    )
    const m = musterUeberZeit(mitAusfall, '2025-05-20')
    expect(m.ausgebliebenLetztesJahr).toBe(1)
    expect(m.medianLaenge).toBe(28)
  })
})

describe('Kontext fuer Sprueche', () => {
  it('zaehlt Tags der letzten drei Tage', () => {
    const eintraege = [
      { date: '2025-05-01', geist: ['gestresst'] },
      { date: '2025-05-02', geist: ['gestresst'] },
      { date: '2025-05-03', geist: ['gestresst'], energie: 2 },
    ]
    const k = spruchKontext(eintraege, '2025-05-03')
    expect(k.tagZaehler['geist:gestresst']).toBe(3)
    expect(k.letzteEnergie).toBe(2)
  })

  it('findet die meistgenutzten Tags', () => {
    const top = meistgenutzteTags(eintraegeBauen(), 3)
    expect(top[0].anzahl).toBeGreaterThan(0)
    expect(top.length).toBeLessThanOrEqual(3)
  })
})

describe('Testdaten', () => {
  const { zyklen: tz, eintraege: te } = testdatenErzeugen({ bisDatum: '2025-06-01' })

  it('erzeugt sechs auswertbare Zyklen plus einen laufenden', () => {
    expect(tz.length).toBe(8)
    const aufbereitet = aufbereiteteZyklen(tz, '2025-06-01')
    expect(datenlage(aufbereitet).genug).toBe(true)
  })

  it('enthaelt einen ausgebliebenen Zyklus', () => {
    const aufbereitet = aufbereiteteZyklen(tz, '2025-06-01')
    expect(aufbereitet.some((z) => z.status === 'ausgeblieben')).toBe(true)
  })

  it('zeigt in der Lutealphase ein erkennbares Muster', () => {
    const aufbereitet = aufbereiteteZyklen(tz, '2025-06-01')
    const d = zyklusDaten(aufbereitet, te)
    const stat = phasenStatistik(d, 'stimmung')
    const foll = stat.find((s) => s.phase === 'follikel').median
    const lut = stat.find((s) => s.phase === 'luteal').median
    expect(lut).toBeLessThanOrEqual(foll)
  })

  it('ist deterministisch', () => {
    const a = testdatenErzeugen({ bisDatum: '2025-06-01' })
    const b = testdatenErzeugen({ bisDatum: '2025-06-01' })
    expect(a.eintraege).toEqual(b.eintraege)
  })
})
