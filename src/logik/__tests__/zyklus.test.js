import { describe, it, expect } from 'vitest'
import {
  aufbereiteteZyklen,
  statusFuerLaenge,
  prognose,
  aktuellerStand,
  phaseFuerZyklustag,
  tagRueckwaerts,
  zyklusVorschlaege,
  arztHinweisNoetig,
  zyklusFuerDatum,
} from '../zyklus.js'

const z = (id, startDate, extra = {}) => ({
  id,
  startDate,
  endDate: null,
  status: 'normal',
  inStatistik: true,
  statusManuell: false,
  inStatistikManuell: false,
  ...extra,
})

describe('Status aus der Zykluslaenge', () => {
  it('vergibt normal, lang, ausgeblieben, unklar', () => {
    expect(statusFuerLaenge(28)).toBe('normal')
    expect(statusFuerLaenge(21)).toBe('normal')
    expect(statusFuerLaenge(35)).toBe('normal')
    expect(statusFuerLaenge(40)).toBe('lang')
    expect(statusFuerLaenge(62)).toBe('ausgeblieben')
    expect(statusFuerLaenge(15)).toBe('unklar')
  })
})

describe('aufbereiteteZyklen', () => {
  const zyklen = [z(1, '2025-01-01'), z(2, '2025-01-29'), z(3, '2025-04-01'), z(4, '2025-04-28')]
  const auf = aufbereiteteZyklen(zyklen, '2025-05-10')

  it('berechnet Laengen aus dem jeweils naechsten Start', () => {
    expect(auf.map((x) => x.laenge)).toEqual([28, 62, 27, null])
  })

  it('nimmt den 62-Tage-Zyklus aus der Statistik', () => {
    expect(auf[1].status).toBe('ausgeblieben')
    expect(auf[1].inStatistik).toBe(false)
  })

  it('laesst manuell gesetzte Werte stehen', () => {
    const manuell = aufbereiteteZyklen(
      [z(1, '2025-01-01'), z(2, '2025-03-04', { status: 'unklar', statusManuell: true, inStatistik: true, inStatistikManuell: true })],
      '2025-03-10',
    )
    expect(manuell[1].status).toBe('unklar')
    expect(manuell[1].inStatistik).toBe(true)
  })

  it('markiert den letzten Zyklus als laufend', () => {
    expect(auf[3].laufend).toBe(true)
    expect(auf[3].bisherigeTage).toBe(13)
  })
})

describe('Prognose', () => {
  it('nutzt den Median und ignoriert ausgebliebene Zyklen', () => {
    // Laengen: 28, 62 (ausgeblieben), 27, 29, 30, 28 -> Median ohne 62
    const zyklen = [
      z(1, '2025-01-01'), z(2, '2025-01-29'), z(3, '2025-04-01'),
      z(4, '2025-04-28'), z(5, '2025-05-27'), z(6, '2025-06-26'), z(7, '2025-07-24'),
    ]
    const auf = aufbereiteteZyklen(zyklen, '2025-08-01')
    const p = prognose(auf, '2025-07-24')
    expect(p.medianLaenge).toBe(28)
    expect(p.anzahlBasis).toBe(5)
    expect(p.erwarteterStart).toBe('2025-08-21')
  })

  it('gibt ein Fenster statt eines Datums aus', () => {
    const zyklen = [
      z(1, '2025-01-01'), z(2, '2025-01-27'), z(3, '2025-02-26'),
      z(4, '2025-03-22'), z(5, '2025-04-24'), z(6, '2025-05-20'),
    ]
    const auf = aufbereiteteZyklen(zyklen, '2025-06-01')
    const p = prognose(auf, '2025-05-20')
    const [von, bis] = p.fensterTage
    expect(bis).toBeGreaterThan(von)
    expect(p.fensterVon < p.fensterBis).toBe(true)
  })

  it('faellt ohne Daten auf 28 Tage zurueck', () => {
    const p = prognose([], null)
    expect(p.medianLaenge).toBe(28)
    expect(p.genug).toBe(false)
  })
})

describe('Phasen', () => {
  it('ordnet Tage bei 28 Tagen Laenge zu', () => {
    expect(phaseFuerZyklustag(1, 28, 5)).toBe('menstruation')
    expect(phaseFuerZyklustag(5, 28, 5)).toBe('menstruation')
    expect(phaseFuerZyklustag(6, 28, 5)).toBe('follikel')
    expect(phaseFuerZyklustag(14, 28, 5)).toBe('eisprung')
    expect(phaseFuerZyklustag(15, 28, 5)).toBe('luteal')
    expect(phaseFuerZyklustag(28, 28, 5)).toBe('luteal')
  })

  it('haelt die Lutealphase bei langen Zyklen konstant', () => {
    expect(phaseFuerZyklustag(21, 35, 5)).toBe('eisprung')
    expect(phaseFuerZyklustag(22, 35, 5)).toBe('luteal')
    // 14 Lutealtage, egal wie lang der Zyklus ist
    const lutealTage = [35, 40].map((l) => l - (l - 14))
    expect(lutealTage).toEqual([14, 14])
  })

  it('zaehlt rueckwaerts ab dem naechsten Periodenstart', () => {
    expect(tagRueckwaerts(28, 28)).toBe(-1)
    expect(tagRueckwaerts(27, 28)).toBe(-2)
    expect(tagRueckwaerts(14, 28)).toBe(-15)
    // derselbe Abstand zur Periode trotz unterschiedlicher Zykluslaenge
    expect(tagRueckwaerts(34, 34)).toBe(-1)
  })
})

describe('Wartemodus', () => {
  const basis = [
    z(1, '2025-01-01'), z(2, '2025-01-29'), z(3, '2025-02-26'),
    z(4, '2025-03-26'), z(5, '2025-04-23'), z(6, '2025-05-21'), z(7, '2025-06-18'),
  ]

  it('zeigt normal die Phase an', () => {
    const auf = aufbereiteteZyklen(basis, '2025-07-01')
    const stand = aktuellerStand(auf, '2025-07-01')
    expect(stand.zyklustag).toBe(14)
    expect(stand.wartemodus).toBe(false)
    expect(stand.phase).toBe('eisprung')
  })

  it('blendet die Phase aus, sobald die Periode ueberfaellig ist', () => {
    // Median 28 -> Schwelle max(28+7, 35) = 35, also ab Tag 36
    const auf = aufbereiteteZyklen(basis, '2025-07-24')
    const stand = aktuellerStand(auf, '2025-07-24') // Tag 37
    expect(stand.zyklustag).toBe(37)
    expect(stand.ueberfaellig).toBe(true)
    expect(stand.wartemodus).toBe(true)
    expect(stand.phase).toBe('unbekannt')
    expect(stand.ueberfaelligTage).toBe(9)
  })

  it('meldet an Tag 35 noch nichts', () => {
    const auf = aufbereiteteZyklen(basis, '2025-07-22')
    const stand = aktuellerStand(auf, '2025-07-22')
    expect(stand.zyklustag).toBe(35)
    expect(stand.ueberfaellig).toBe(false)
  })

  it('wartet auch bei manuell unklarem Zyklus', () => {
    const zyklen = [...basis.slice(0, 6), z(7, '2025-06-18', { status: 'unklar', statusManuell: true })]
    const auf = aufbereiteteZyklen(zyklen, '2025-06-30')
    expect(aktuellerStand(auf, '2025-06-30').wartemodus).toBe(true)
  })
})

describe('Zyklen aus Blutungseintraegen', () => {
  it('startet einen Zyklus beim ersten kraeftigen Blutungstag', () => {
    const eintraege = [
      { date: '2025-01-01', blutung: 3 },
      { date: '2025-01-02', blutung: 3 },
      { date: '2025-01-03', blutung: 2 },
      { date: '2025-01-29', blutung: 4 },
    ]
    const { neueStarts, enden } = zyklusVorschlaege(eintraege, [])
    expect(neueStarts).toEqual(['2025-01-01', '2025-01-29'])
    expect(enden['2025-01-01']).toBe('2025-01-03')
  })

  it('startet keinen Zyklus wegen Schmierblutung', () => {
    const eintraege = [
      { date: '2025-01-01', blutung: 3 },
      { date: '2025-01-14', blutung: 1 },
    ]
    expect(zyklusVorschlaege(eintraege, []).neueStarts).toEqual(['2025-01-01'])
  })

  it('startet keinen zweiten Zyklus mitten in der Blutung', () => {
    const eintraege = [
      { date: '2025-01-01', blutung: 4 },
      { date: '2025-01-02', blutung: 4 },
      { date: '2025-01-03', blutung: 3 },
      { date: '2025-01-04', blutung: 2 },
    ]
    expect(zyklusVorschlaege(eintraege, []).neueStarts).toEqual(['2025-01-01'])
  })

  it('erkennt vorhandene Zyklen und schlaegt nur Neues vor', () => {
    const eintraege = [
      { date: '2025-01-01', blutung: 3 },
      { date: '2025-02-02', blutung: 3 },
    ]
    const zyklen = [{ id: 1, startDate: '2025-01-01', endDate: '2025-01-04' }]
    expect(zyklusVorschlaege(eintraege, zyklen).neueStarts).toEqual(['2025-02-02'])
  })
})

describe('Aerztlicher Hinweis', () => {
  it('meldet drei ausgebliebene Zyklen in Folge', () => {
    const zyklen = [
      z(1, '2024-06-01'), z(2, '2024-08-15'), z(3, '2024-10-20'), z(4, '2024-12-30'),
    ]
    const auf = aufbereiteteZyklen(zyklen, '2025-01-10')
    expect(arztHinweisNoetig(auf, '2025-01-10').noetig).toBe(true)
  })

  it('meldet ueber 90 Tage ohne Blutung', () => {
    const auf = aufbereiteteZyklen([z(1, '2025-01-01')], '2025-05-01')
    const hinweis = arztHinweisNoetig(auf, '2025-05-01')
    expect(hinweis.noetig).toBe(true)
    expect(hinweis.grund).toBe('lange-ohne-blutung')
  })

  it('schweigt bei regelmaessigen Zyklen', () => {
    const zyklen = [z(1, '2025-01-01'), z(2, '2025-01-29'), z(3, '2025-02-26')]
    const auf = aufbereiteteZyklen(zyklen, '2025-03-05')
    expect(arztHinweisNoetig(auf, '2025-03-05').noetig).toBe(false)
  })
})

describe('zyklusFuerDatum', () => {
  it('findet den passenden Zyklus', () => {
    const auf = aufbereiteteZyklen([z(1, '2025-01-01'), z(2, '2025-01-29')], '2025-02-10')
    expect(zyklusFuerDatum(auf, '2025-01-15').id).toBe(1)
    expect(zyklusFuerDatum(auf, '2025-01-29').id).toBe(2)
    expect(zyklusFuerDatum(auf, '2024-12-31')).toBe(null)
  })
})
