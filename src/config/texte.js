/**
 * Alle Texte der App an einer Stelle: Phaseninfos, Sprueche, Tipps,
 * Hinweise. Ton laut Briefing 11: sachlich, zurueckhaltend, keine Diagnosen,
 * kein Druck.
 */

export const PHASEN_INFO = {
  menstruation: {
    titel: 'Menstruation',
    text:
      'Die Gebärmutterschleimhaut wird abgebaut, Östrogen und Progesteron sind ' +
      'niedrig. Müdigkeit, Krämpfe und ein grösseres Ruhebedürfnis sind in dieser ' +
      'Phase häufig. Zyklustag 1 ist der erste Tag der Blutung.',
  },
  follikel: {
    titel: 'Follikelphase',
    text:
      'Nach der Blutung reifen im Eierstock mehrere Follikel heran, das Östrogen ' +
      'steigt an. Viele beschreiben diese Phase als energiereicher und klarer. ' +
      'Ihre Länge schwankt am stärksten — sie bestimmt, wie lang ein Zyklus wird.',
  },
  eisprung: {
    titel: 'Eisprung',
    text:
      'Ein LH-Anstieg löst den Eisprung aus. Der Zeitpunkt hier ist rückwärts ' +
      'geschätzt: rund 14 Tage vor der nächsten erwarteten Blutung. Ohne LH- oder ' +
      'Bluttest misst die App den Eisprung nicht — die Angabe hat mehrere Tage ' +
      'Unsicherheit und ist nicht zur Verhütung geeignet.',
  },
  luteal: {
    titel: 'Lutealphase',
    text:
      'Der Gelbkörper bildet Progesteron. Diese Phase ist mit etwa 12–14 Tagen ' +
      'relativ konstant. Hier liegen die meisten prämenstruellen Veränderungen — ' +
      'deshalb wird in der Auswertung rückwärts ab dem nächsten Periodenstart ' +
      'gezählt.',
  },
  unbekannt: {
    titel: 'Position im Zyklus unbekannt',
    text:
      'Solange die Periode überfällig ist, lässt sich nicht sagen, in welcher ' +
      'Phase du gerade bist. Statt einer erfundenen Angabe zeigt die App hier ' +
      'nichts an. Symptome kannst du normal weiter eintragen.',
  },
}

export const PHASEN_TIPPS = {
  menstruation: [
    'Wärme am Unterbauch lindert Krämpfe bei vielen zuverlässiger als Bewegung.',
    'Sanfte Bewegung — Spazieren, Dehnen — ist oft angenehmer als Training.',
    'Eisenreiches Essen kann bei starker Blutung sinnvoll sein.',
    'Wenn möglich: weniger Termine als sonst einplanen.',
  ],
  follikel: [
    'Für Vorhaben, die Anlauf brauchen, ist diese Phase bei vielen die leichteste.',
    'Kraft- oder Ausdauertraining fällt hier oft leichter als später im Zyklus.',
    'Gute Phase, um Dinge zu beginnen statt abzuschliessen.',
  ],
  eisprung: [
    'Manche bemerken einen kurzen Mittelschmerz — das ist unauffällig.',
    'Die Haut reagiert bei einigen in diesen Tagen empfindlicher.',
  ],
  luteal: [
    'Wenn der Schlaf unruhiger wird: früher abschalten hilft mehr als früher hinlegen.',
    'Regelmässige Mahlzeiten dämpfen Heisshunger und Stimmungsschwankungen.',
    'Kürzere, ruhigere Einheiten statt Belastungsspitzen.',
    'Reizbarkeit in dieser Phase ist verbreitet — sie sagt nichts über den Anlass aus.',
  ],
  unbekannt: [
    'Weiter eintragen lohnt sich gerade jetzt: ausgebliebene Zyklen sind ein Datenpunkt.',
  ],
}

/**
 * Sprueche.
 * `phase`  — fuer welche Phase (oder null = jede)
 * `wenn`   — optionale Bedingung auf den Daten der letzten Tage
 *            (kontext: { tagZaehler, letzteStimmung, letzteEnergie, zyklustag })
 * Ton: zurueckhaltend. Jeder Spruch ist wegwischbar.
 */
export const SPRUECHE = [
  // datengetrieben
  {
    id: 'stress-3-tage',
    text: 'Drei Tage hintereinander „gestresst“ eingetragen. Das ist viel — vielleicht lässt sich diese Woche etwas streichen.',
    wenn: (k) => (k.tagZaehler['geist:gestresst'] || 0) >= 3,
  },
  {
    id: 'ueberfordert-2-tage',
    text: 'Zweimal „überfordert“ in Folge. Nichts davon muss heute gelöst werden.',
    wenn: (k) => (k.tagZaehler['geist:ueberfordert'] || 0) >= 2,
  },
  {
    id: 'energie-hoch',
    text: 'Die Energie ist gerade oben. Gute Tage sind ein guter Zeitpunkt für das, was länger liegen bleibt.',
    wenn: (k) => k.letzteEnergie >= 4,
  },
  {
    id: 'stimmung-tief-2-tage',
    text: 'Zwei ruhige Tage hintereinander. Der Zyklus erklärt nicht alles — aber manchmal einen Teil davon.',
    wenn: (k) => k.stimmungSchnitt3 !== null && k.stimmungSchnitt3 <= 2.2,
  },
  {
    id: 'schmerz-mehrfach',
    text: 'Mehrere Schmerz-Einträge in dieser Woche. Wenn das öfter vorkommt, ist es für ein Arztgespräch notiert.',
    wenn: (k) => k.schmerzTage7 >= 3,
  },
  // phasengebunden
  {
    id: 'mens-ruhe',
    phase: 'menstruation',
    text: 'Wenig zu wollen ist an diesen Tagen kein Rückschritt.',
  },
  {
    id: 'mens-koerper',
    phase: 'menstruation',
    text: 'Der Körper macht heute Arbeit, die man nicht sieht.',
  },
  {
    id: 'foll-anlauf',
    phase: 'follikel',
    text: 'Östrogen steigt. Falls etwas leichter fällt als letzte Woche: das ist der Grund.',
  },
  {
    id: 'foll-beginnen',
    phase: 'follikel',
    text: 'Gute Phase für Anfänge — nicht für Bilanzen.',
  },
  {
    id: 'eis-mitte',
    phase: 'eisprung',
    text: 'Zyklusmitte, geschätzt. Der Körper hält sich selten exakt an Kalender.',
  },
  {
    id: 'lut-massstab',
    phase: 'luteal',
    text: 'In der Lutealphase fällt der Massstab an sich selbst gern strenger aus als sonst.',
  },
  {
    id: 'lut-normal',
    phase: 'luteal',
    text: 'Wenn heute alles etwas zu viel ist: das passt zur Phase und geht vorbei.',
  },
  {
    id: 'unbek-warten',
    phase: 'unbekannt',
    text: 'Warten ist unangenehm. Die Einträge laufen unverändert weiter.',
  },
]

export const HINWEISE = {
  hormondiagramm:
    'Kein Diagramm deiner eigenen Hormone, sondern ein Lehrbuchmodell, skaliert ' +
    'auf deine Zykluslänge. Ohne Blut- oder LH-Test misst die App davon nichts.',
  hormondiagrammVerhuetung:
    'Bei hormoneller Verhütung ausgeblendet: der typische Verlauf trifft dann nicht zu.',
  eisprungSchaetzung:
    'Geschätzt, rund 14 Tage vor der nächsten erwarteten Blutung. Mehrere Tage ' +
    'Unsicherheit — nicht zur Verhütung geeignet.',
  prognoseFenster:
    'Ein Fenster statt eines Datums: bei schwankenden Zyklen wäre ein exakter Tag ' +
    'eine Scheingenauigkeit.',
  zuWenigDaten: (fehlend) =>
    `Noch ${fehlend} ${fehlend === 1 ? 'vollständiger Zyklus' : 'vollständige Zyklen'} bis zur Auswertung. ` +
    'Vorher wäre das Rauschen und keine Erkenntnis.',
  confounder:
    'Stimmung hat viele Einflüsse — Schlaf, Wochentag, Stress. Ein Muster über ' +
    'den Zyklus ist ein Zusammenhang, keine Ursache.',
  ueberfaellig: () =>
    'Verspätungen sind häufig, und Stress verzögert zusätzlich. Es muss nichts ' +
    'davon etwas bedeuten.',
  wartemodus:
    'Phase, Eisprung und Hormonverlauf sind ausgeblendet, solange die Position im ' +
    'Zyklus unklar ist.',
  arzt:
    'Das kommt jetzt öfter vor. Ausbleibende Blutungen über längere Zeit gehören ' +
    'einmal ärztlich abgeklärt — das ist keine Diagnose, nur der übliche nächste Schritt.',
  export:
    'Safari kann die Daten löschen, wenn die App rund sieben Wochen ungenutzt ' +
    'bleibt. Ein Export ab und zu ist die einzige Sicherung.',
  keineDiagnose:
    'Diese App sammelt und zeigt Daten. Sie stellt keine Diagnosen, ersetzt keine ' +
    'Verhütung und trifft keine Aussagen über Schwangerschaft.',
}

export const UEBERFAELLIG_ANTWORTEN = [
  {
    id: 'nachtragen',
    wort: 'hatte sie, nur nicht eingetragen',
    beschreibung: 'Datum nachtragen — der Zyklus wird dann normal gerechnet.',
  },
  {
    id: 'nicht-gekommen',
    wort: 'noch nicht gekommen',
    beschreibung: 'Der Zyklus wird als ausgeblieben geführt und fliesst nicht in die Prognose ein.',
  },
  {
    id: 'unsicher',
    wort: 'nicht sicher',
    beschreibung: 'Bleibt als unklar in der Historie, ohne die Vorhersage zu verändern.',
  },
]
