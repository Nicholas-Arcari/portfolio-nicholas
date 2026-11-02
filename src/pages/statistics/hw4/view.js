// src/pages/statistics/hw4/view.js
// Logica di presentazione dell'Homework #4. Per ora solo le sezioni delle
// due parti, per l'indice: quando arrivera' la consegna, ogni parte avra' le
// sue sottosezioni, come negli altri homework.

/** The sections of the homework, in page order: ids for the anchors, keys for the titles. */
export const SECTIONS = [
  { id: 'hw4-part1', key: 'part1', level: 0 },
  { id: 'hw4-part2', key: 'part2', level: 0 },
];

/** The entries of the index: the sections with their titles in the current language. */
export const tocEntries = (titles) => SECTIONS.map((s) => ({ ...s, title: titles[s.key] }));
