// src/config/homework.js
// Gli homework di Statistics, condivisi con il professore attraverso questo
// sito. Per aggiungerne uno: una voce qui, il suo file in pages/statistics e
// la sua rotta in App.jsx.
//
// Le date sono istanti precisi, con lo scarto da UTC scritto per esteso: a
// video vengono sempre mostrate nell'ora di Roma, qualunque sia il fuso di
// chi apre la pagina, e il passaggio fra CEST e CET lo gestisce il browser.
//
// I parametri citati nelle descrizioni vengono dalla stessa costante usata
// dal codice dell'homework: se la consegna cambia, cambia anche qui.
import { TASK as HW1 } from '../pages/statistics/hw1/homework1.js';

const hw1Curve = `y² = x³ + ${HW1.b} mod ${HW1.p}, G = (${HW1.G.x}, ${HW1.G.y}), k = ${HW1.k}`;

export const STATISTICS_HOMEWORK = [
  {
    slug: 'homework-1',
    name: 'Homework #1',
    description: {
      it: `Crittografia a chiave pubblica: dalla chiave privata alla chiave pubblica con la moltiplicazione scalare su curva ellittica, come in Ethereum (curva giocattolo ${hw1Curve}), con animazione dell'algoritmo, esplorazione statistica e discussione.`,
      en: `Public-key cryptography: from a private key to a public key with elliptic-curve scalar multiplication, as in Ethereum (toy curve ${hw1Curve}), with an animation of the algorithm, a statistical exploration and a discussion.`,
    },
    created: '2026-10-12T08:28:00+02:00',
    due: '2026-10-15T00:00:00+02:00',
  },
  {
    slug: 'homework-2',
    name: 'Homework #2',
    description: { it: '', en: '' },
    created: '2026-10-12T08:28:00+02:00',
    due: '2026-10-15T00:00:00+02:00',
  },
];
