// src/config/homework.js
// Gli homework di Statistics, condivisi con il professore attraverso questo
// sito. Per aggiungerne uno: una voce qui, il suo file in pages/statistics e
// la sua rotta in App.jsx.
//
// Le date sono istanti precisi, con lo scarto da UTC scritto per esteso: a
// video vengono sempre mostrate nell'ora di Roma, qualunque sia il fuso di
// chi apre la pagina, e il passaggio fra CEST e CET lo gestisce il browser.
// Una scadenza non ancora comunicata e' null, e si legge "da definire".
//
// I parametri citati nelle descrizioni vengono dalla stessa costante usata
// dal codice dell'homework: se la consegna cambia, cambia anche qui.
import { TASK as HW1 } from '../pages/statistics/hw1/task.js';

const hw1Curve = `y² = x³ + ${HW1.b} mod ${HW1.p}, G = (${HW1.G.x}, ${HW1.G.y}), k = ${HW1.k}`;

export const STATISTICS_HOMEWORK = [
  {
    slug: 'homework-1',
    name: 'Homework #1 - Exercise 1',
    description: {
      it: `Crittografia a chiave pubblica: dalla chiave privata alla chiave pubblica con la moltiplicazione scalare su curva ellittica, come in Ethereum (curva giocattolo ${hw1Curve}), con animazione dell'algoritmo, esplorazione statistica e discussione.`,
      en: `Public-key cryptography: from a private key to a public key with elliptic-curve scalar multiplication, as in Ethereum (toy curve ${hw1Curve}), with an animation of the algorithm, a statistical exploration and a discussion.`,
    },
    created: '2026-10-12T08:28:00+02:00',
    due: '2026-10-15T21:00:00+02:00',
  },
  {
    slug: 'homework-2',
    name: 'Homework #1 - Exercise 2',
    description: {
      it: `Dalla frase mnemonica all'indirizzo Ethereum: la pipeline di un wallet (BIP-39, BIP-32, BIP-44, secp256k1, Keccak-256, EIP-55) scritta da zero e verificata con i vettori di test ufficiali, la distinzione fra generazione e derivazione delle chiavi, crittografia a chiave pubblica, hashing, checksum e codifica, le proprietà statistiche di ogni passaggio e il contesto storico.`,
      en: `From a mnemonic sentence to an Ethereum address: the wallet pipeline (BIP-39, BIP-32, BIP-44, secp256k1, Keccak-256, EIP-55) written from scratch and checked against the official test vectors, the distinction between key generation and derivation, public-key cryptography, hashing, checksums and encoding, the statistical properties of every step and the historical context.`,
    },
    created: '2026-10-13T13:30:00+02:00',
    due: '2026-10-15T21:00:00+02:00',
  },
  {
    // homework-2a e non homework-2: gli indirizzi dei due esercizi
    // dell'Homework #1 restano quelli di prima fino alla fine del corso
    slug: 'homework-2a',
    name: 'Homework #2',
    description: {
      it: "Uno schema giocattolo su secp256k1 (ElGamal su curva ellittica con chiavi private di 32 bit) e il cifrario di Cesare: cifrare e decifrare lo stesso messaggio, confrontare procedure, spazi delle chiavi e proprietà statistiche, rompere Cesare con la statistica di un corpus inglese (massima verosimiglianza, χ², n-grammi, dizionario) e lo schema giocattolo con la ricerca esaustiva, baby-step giant-step e il canguro di Pollard, con test d'ipotesi, contesto storico e discussione.",
      en: "A toy scheme on secp256k1 (elliptic-curve ElGamal with 32-bit private keys) and the Caesar cipher: encrypting and decrypting the same message, comparing procedures, key spaces and statistical properties, breaking Caesar with the statistics of an English corpus (maximum likelihood, χ², n-grams, dictionary) and the toy scheme with exhaustive search, baby-step giant-step and Pollard's kangaroo, with hypothesis tests, historical context and discussion.",
    },
    created: '2026-10-15T20:25:00+02:00',
    due: '2026-10-20T21:00:00+02:00',
  },
];
