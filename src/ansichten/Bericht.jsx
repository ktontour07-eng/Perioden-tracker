/**
 * Uebersicht fuers Arztgespraech (Briefing 7.5): letzte Zyklen mit Laenge,
 * Status und auffaelligen Symptomen — als Liste zum Ausdrucken oder als
 * Textdatei.
 */

import { useMemo } from 'react'
import { REGELN, SCHMERZ_REGIONEN, TAG_KATEGORIEN, ZYKLUS_STATUS } from '../config/kategorien.js'
import { formatMitJahr, heute as heuteISO, plusTage } from '../logik/datum.js'
import { istBefuellt, musterUeberZeit, tagHaeufigkeiten } from '../logik/auswertung.js'

export default function Bericht({ daten, gehZu }) {
  const { zyklen, eintraege, zyklusDaten: zd, bezugsdatum, lage } = daten
  const muster = useMemo(() => musterUeberZeit(zyklen, bezugsdatum), [zyklen, bezugsdatum])
  const zeilen = useMemo(() => zyklusZeilen(zyklen, eintraege), [zyklen, eintraege])
  const auffaellig = useMemo(() => auffaelligeTags(zd), [zd])

  const text = useMemo(
    () => alsText({ zeilen, muster, auffaellig, lage }),
    [zeilen, muster, auffaellig, lage],
  )

  return (
    <>
      <div className="kopf">
        <div>
          <h1>Übersicht</h1>
          <div className="leise klein">Stand {formatMitJahr(heuteISO())}</div>
        </div>
        <button type="button" className="knopf leise" onClick={() => gehZu('zyklen')}>
          zurück
        </button>
      </div>

      <div className="karte">
        <h2>Zyklen im Überblick</h2>
        <ul className="liste abstand-oben">
          <li>
            <span className="leise">Erfasste Zyklen</span>
            <span>{muster.gesamt}</span>
          </li>
          <li>
            <span className="leise">Median der Länge</span>
            <span>{muster.medianLaenge ? `${muster.medianLaenge} Tage` : '–'}</span>
          </li>
          <li>
            <span className="leise">Spanne / Streuung</span>
            <span>
              {muster.kuerzeste ? `${muster.kuerzeste}–${muster.laengste} Tage` : '–'}
              {muster.streuung !== null ? ` (± ${muster.streuung})` : ''}
            </span>
          </li>
          <li>
            <span className="leise">Ausgeblieben / unklar (letztes Jahr)</span>
            <span>
              {muster.ausgebliebenLetztesJahr} / {muster.unklarLetztesJahr}
            </span>
          </li>
        </ul>
      </div>

      <div className="karte">
        <h2>Einzelne Zyklen</h2>
        <ul className="liste abstand-oben">
          {zeilen.map((z) => (
            <li key={z.start} style={{ alignItems: 'flex-start' }}>
              <span>
                <div>{formatMitJahr(z.start)}</div>
                <div className="klein leise">
                  {z.laenge ? `${z.laenge} Tage` : 'läuft'} · Blutung {z.mensTage || '–'} Tage
                  {z.schmerz ? ` · Schmerzen an ${z.schmerz} Tagen` : ''}
                  {z.starkeBlutungTage ? ` · starke Blutung an ${z.starkeBlutungTage} Tagen` : ''}
                </div>
                {z.regionen.length > 0 && (
                  <div className="klein sehr-leise">{z.regionen.join(', ')}</div>
                )}
              </span>
              <span className={`marke ${z.status}`}>{ZYKLUS_STATUS[z.status]?.wort}</span>
            </li>
          ))}
        </ul>
      </div>

      {auffaellig.length > 0 && (
        <div className="karte">
          <h2>Auffällige Symptome</h2>
          <div className="klein leise abstand-unten">
            Grösster Unterschied zwischen Luteal- und Follikelphase, in Prozent der Tage.
          </div>
          <ul className="liste">
            {auffaellig.map((a) => (
              <li key={a.key}>
                <span>
                  {a.option.icon} {a.option.wort}
                  <div className="klein leise">{a.kategorie}</div>
                </span>
                <span className="klein leise">
                  luteal {Math.round(a.werte.luteal)} % · follikulär {Math.round(a.werte.follikel)} %
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="karte">
        <div className="knopf-reihe">
          <button type="button" className="knopf" onClick={() => window.print()}>
            Drucken / als PDF sichern
          </button>
          <button type="button" className="knopf leise" onClick={() => textSpeichern(text)}>
            Als Textdatei speichern
          </button>
        </div>
        <div className="fussnote">
          Zusammenstellung eigener Einträge. Keine Diagnose und keine ärztliche Bewertung.
          {!lage.genug && ' Die Datenbasis ist noch klein.'}
        </div>
      </div>
    </>
  )
}

function zyklusZeilen(zyklen, eintraege) {
  const nachDatum = new Map(eintraege.map((e) => [e.date, e]))
  return [...zyklen]
    .reverse()
    .slice(0, 14)
    .map((z) => {
      const tage = []
      const ende = z.laenge || z.bisherigeTage || 1
      for (let i = 0; i < ende; i++) {
        const e = nachDatum.get(plusTage(z.startDate, i))
        if (e) tage.push(e)
      }
      const regionen = [
        ...new Set(
          tage.flatMap((t) => (t.schmerzen || []).map((s) => s.region)),
        ),
      ].map((id) => SCHMERZ_REGIONEN.find((r) => r.id === id)?.wort || id)

      return {
        start: z.startDate,
        laenge: z.laenge,
        status: z.status,
        mensTage: z.mensTage,
        schmerz: tage.filter((t) => (t.schmerzen || []).length).length,
        starkeBlutungTage: tage.filter((t) => (t.blutung || 0) >= 4).length,
        eintraege: tage.filter(istBefuellt).length,
        regionen,
      }
    })
}

function auffaelligeTags(zd) {
  return TAG_KATEGORIEN.flatMap((k) => {
    const h = tagHaeufigkeiten(zd, k.id)
    return h.zeilen
      .filter((z) => z.unterschied !== null && Math.abs(z.unterschied) >= 20)
      .map((z) => ({ ...z, kategorie: k.titel }))
  })
    .sort((a, b) => Math.abs(b.unterschied) - Math.abs(a.unterschied))
    .slice(0, 8)
}

function alsText({ zeilen, muster, auffaellig, lage }) {
  const zeile = (s) => s + '\n'
  let t = zeile('Zyklusübersicht')
  t += zeile(`Stand: ${formatMitJahr(heuteISO())}`)
  t += zeile('')
  t += zeile(`Erfasste Zyklen: ${muster.gesamt}`)
  t += zeile(`Median der Länge: ${muster.medianLaenge ?? '–'} Tage`)
  t += zeile(`Spanne: ${muster.kuerzeste ?? '–'}–${muster.laengste ?? '–'} Tage (± ${muster.streuung ?? '–'})`)
  t += zeile(`Ausgeblieben im letzten Jahr: ${muster.ausgebliebenLetztesJahr}`)
  t += zeile(`Unklar im letzten Jahr: ${muster.unklarLetztesJahr}`)
  t += zeile('')
  t += zeile('Einzelne Zyklen:')
  for (const z of zeilen) {
    t += zeile(
      `  ${formatMitJahr(z.start)} · ${z.laenge ? z.laenge + ' Tage' : 'läuft'} · ${ZYKLUS_STATUS[z.status]?.wort}` +
        `${z.mensTage ? ` · Blutung ${z.mensTage} Tage` : ''}` +
        `${z.schmerz ? ` · Schmerzen an ${z.schmerz} Tagen (${z.regionen.join(', ')})` : ''}`,
    )
  }
  if (auffaellig.length) {
    t += zeile('')
    t += zeile('Auffällige Symptome (luteal vs. follikulär, Prozent der Tage):')
    for (const a of auffaellig) {
      t += zeile(`  ${a.option.wort}: ${Math.round(a.werte.luteal)} % vs. ${Math.round(a.werte.follikel)} %`)
    }
  }
  t += zeile('')
  t += zeile(
    `Hinweis: eigene Einträge, keine ärztliche Bewertung.${lage.genug ? '' : ` Weniger als ${REGELN.minZyklenFuerAuswertung} auswertbare Zyklen.`}`,
  )
  return t
}

function textSpeichern(text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `zyklus-uebersicht-${heuteISO()}.txt`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
