import { describe, it, expect } from 'vitest'
import { alsISO, ausISO, plusTage, tageDazwischen, tagesSpanne, relativ } from '../datum.js'

describe('Datumshilfen', () => {
  it('rechnet Tage ueber Monatsgrenzen', () => {
    expect(plusTage('2025-01-30', 3)).toBe('2025-02-02')
    expect(plusTage('2025-03-01', -1)).toBe('2025-02-28')
    expect(plusTage('2024-02-28', 1)).toBe('2024-02-29')
  })

  it('zaehlt Tage unabhaengig von der Sommerzeitumstellung', () => {
    // Ende Maerz und Ende Oktober: in Europa Zeitumstellung
    expect(tageDazwischen('2025-03-29', '2025-03-31')).toBe(2)
    expect(tageDazwischen('2025-10-25', '2025-10-27')).toBe(2)
    expect(tageDazwischen('2025-01-01', '2025-12-31')).toBe(364)
  })

  it('wandelt hin und zurueck', () => {
    expect(alsISO(ausISO('2025-07-04'))).toBe('2025-07-04')
  })

  it('erzeugt eine Tagesspanne einschliesslich der Grenzen', () => {
    expect(tagesSpanne('2025-05-01', '2025-05-04')).toEqual([
      '2025-05-01', '2025-05-02', '2025-05-03', '2025-05-04',
    ])
  })

  it('formuliert nahe Tage relativ', () => {
    expect(relativ('2025-05-04', '2025-05-04')).toBe('heute')
    expect(relativ('2025-05-03', '2025-05-04')).toBe('gestern')
  })
})
