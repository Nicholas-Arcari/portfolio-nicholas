// src/config/homework.js
// Gli homework di Statistics, condivisi con il professore attraverso questo
// sito. Per aggiungerne uno: una voce qui, il suo file in pages/statistics e
// la sua rotta in App.jsx.
//
// Le date sono istanti precisi, con lo scarto da UTC scritto per esteso: a
// video vengono sempre mostrate nell'ora di Roma, qualunque sia il fuso di
// chi apre la pagina, e il passaggio fra CEST e CET lo gestisce il browser.
export const STATISTICS_HOMEWORK = [
  {
    slug: 'homework-1',
    name: 'Homework #1',
    description: {
      it: 'Crittografia a chiave pubblica: dalla chiave privata alla chiave pubblica con la moltiplicazione scalare su curva ellittica, come in Ethereum (curva giocattolo y² = x³ + 7 mod 17).',
      en: 'Public-key cryptography: from a private key to a public key with elliptic-curve scalar multiplication, as in Ethereum (toy curve y² = x³ + 7 mod 17).',
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
