/**
 * Der Tageseintrag. Kernanforderung (Briefing 9.1): schnell.
 * - Schnellansicht mit den meistgenutzten Tags ganz oben
 * - Skalen als grosse Flaechen
 * - alles andere aufklappbar, abgeschaltete Kategorien erscheinen gar nicht
 * - getippt wird nur in der Notiz
 */

import { useMemo, useState } from 'react'
import { KATEGORIEN, SCHNELLANSICHT_ANZAHL, TYP } from '../config/kategorien.js'
import { sichtbareOptionen, tagInfoAngepasst } from '../logik/tags.js'
import { Aufklappbar, Chip, Skala, TagWahl } from './Basis.jsx'
import Schmerzeingabe, { schmerzText } from './Schmerzeingabe.jsx'
import SexEingabe, { sexText } from './SexEingabe.jsx'

export default function Tageseintrag({ eintrag, aendern, einstellungen, schnellTags }) {
  const [offen, setOffen] = useState({})
  const versteckt = einstellungen.versteckteKategorien || []

  const sichtbar = KATEGORIEN.filter((k) => !versteckt.includes(k.id))
  const skalen = sichtbar.filter((k) => k.typ === TYP.SKALA)
  const rest = sichtbar.filter((k) => k.typ !== TYP.SKALA)

  const schnell = useMemo(
    () =>
      (schnellTags || [])
        .map((key) => tagInfoAngepasst(key, einstellungen))
        .filter((t) => t && !versteckt.includes(t.kategorie.id) && !t.option.versteckt)
        .slice(0, SCHNELLANSICHT_ANZAHL),
    [schnellTags, versteckt, einstellungen],
  )

  const tagUmschalten = (kategorie, id) => {
    const werte = eintrag[kategorie.feld] || []
    aendern({
      [kategorie.feld]: werte.includes(id) ? werte.filter((w) => w !== id) : [...werte, id],
    })
  }

  return (
    <div>
      {schnell.length > 0 && (
        <div className="karte">
          <div className="zeile-verteilt abstand-unten">
            <h2>Schnellansicht</h2>
            <span className="klein sehr-leise">meistgenutzt</span>
          </div>
          <div className="chips">
            {schnell.map(({ key, kategorie, option }) => (
              <Chip
                key={key}
                option={option}
                farbe={kategorie.farbe}
                aktiv={(eintrag[kategorie.feld] || []).includes(option.id)}
                title={kategorie.titel}
                onClick={() => tagUmschalten(kategorie, option.id)}
              />
            ))}
          </div>
        </div>
      )}

      {skalen.map((k) => (
        <div className="karte" key={k.id}>
          <div className="zeile-verteilt abstand-unten">
            <h2>{k.titel}</h2>
            <span className="klein sehr-leise">
              {wortFuerSkala(k, eintrag[k.feld])}
            </span>
          </div>
          <Skala
            optionen={k.optionen}
            wert={eintrag[k.feld]}
            farbe={k.farbe}
            onChange={(wert) => aendern({ [k.feld]: wert })}
          />
          {k.hinweis && <div className="fussnote">{k.hinweis}</div>}
        </div>
      ))}

      <div className="karte">
        {rest.map((k) => (
          <Aufklappbar
            key={k.id}
            titel={k.titel}
            farbe={k.farbe}
            offen={!!offen[k.id]}
            onUmschalten={() => setOffen((o) => ({ ...o, [k.id]: !o[k.id] }))}
            zusammenfassung={offen[k.id] ? '' : zusammenfassung(k, eintrag, einstellungen)}
          >
            <KategorieEingabe
              kategorie={k}
              eintrag={eintrag}
              aendern={aendern}
              einstellungen={einstellungen}
            />
          </Aufklappbar>
        ))}
      </div>
    </div>
  )
}

function KategorieEingabe({ kategorie: k, eintrag, aendern, einstellungen }) {
  if (k.typ === TYP.TAGS) {
    // Bereits gesetzte, inzwischen ausgeblendete Tags bleiben sichtbar —
    // sonst liesse sich der Eintrag nicht mehr zuruecknehmen.
    return (
      <TagWahl
        optionen={sichtbareOptionen(k, einstellungen, eintrag[k.feld] || [])}
        werte={eintrag[k.feld] || []}
        farbe={k.farbe}
        onChange={(werte) => aendern({ [k.feld]: werte })}
      />
    )
  }
  if (k.typ === TYP.SCHMERZ) {
    return (
      <Schmerzeingabe
        schmerzen={eintrag.schmerzen || []}
        farbe={k.farbe}
        onChange={(schmerzen) => aendern({ schmerzen })}
      />
    )
  }
  if (k.typ === TYP.SEX) {
    return <SexEingabe sex={eintrag.sex || {}} farbe={k.farbe} onChange={(sex) => aendern({ sex })} />
  }
  if (k.typ === TYP.MEDIKAMENTE) {
    const eigene = einstellungen.eigeneMedikamente || []
    if (!eigene.length) {
      return (
        <div className="hinweis">
          Noch keine Präparate angelegt. In den Einstellungen einmal eintragen — danach
          sind sie hier ganz normale Chips.
        </div>
      )
    }
    return (
      <TagWahl
        optionen={eigene.map((m) => ({ id: m.id, wort: m.dosis ? `${m.name} ${m.dosis}` : m.name, icon: '💊' }))}
        werte={eintrag.medikamente || []}
        farbe={k.farbe}
        onChange={(werte) => aendern({ medikamente: werte })}
      />
    )
  }
  if (k.typ === TYP.NOTIZ) {
    return (
      <>
        <textarea
          value={eintrag.notiz || ''}
          onChange={(e) => aendern({ notiz: e.target.value })}
          placeholder="Optional — alles andere geht ohne Tippen."
          aria-label="Notiz"
        />
      </>
    )
  }
  return null
}

function wortFuerSkala(k, wert) {
  if (wert === null || wert === undefined) return ''
  return k.optionen.find((o) => o.wert === wert)?.wort || ''
}

function zusammenfassung(k, eintrag, einstellungen) {
  if (k.typ === TYP.TAGS) {
    const optionen = sichtbareOptionen(k, einstellungen, eintrag[k.feld] || [])
    const gewaehlt = (eintrag[k.feld] || [])
      .map((id) => optionen.find((o) => o.id === id)?.wort)
      .filter(Boolean)
    return gewaehlt.join(' · ')
  }
  if (k.typ === TYP.SCHMERZ) return schmerzText(eintrag.schmerzen || [])
  if (k.typ === TYP.SEX) return sexText(eintrag.sex || {})
  if (k.typ === TYP.MEDIKAMENTE) {
    const eigene = einstellungen.eigeneMedikamente || []
    return (eintrag.medikamente || [])
      .map((id) => eigene.find((m) => m.id === id)?.name)
      .filter(Boolean)
      .join(' · ')
  }
  if (k.typ === TYP.NOTIZ) {
    const n = (eintrag.notiz || '').trim()
    return n ? (n.length > 34 ? n.slice(0, 34) + '…' : n) : ''
  }
  return ''
}
