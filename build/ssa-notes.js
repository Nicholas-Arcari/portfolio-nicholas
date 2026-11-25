// build/ssa-notes.js
// Gli appunti di Security in Software Applications stanno in
// src/pages/ssa/notes, due file per lezione (lecture-NN.en.md e
// lecture-NN.it.md), nel formato descritto in src/pages/ssa/parseNotes.js; le
// figure stanno in public/images/ssa. La build si ferma se:
//
//   - una lezione dell'elenco (src/config/ssa.js) non ha i suoi due file, o
//     c'e' un file che non appartiene a nessuna lezione;
//   - un file non si legge (un segno non chiuso, una tabella zoppa);
//   - italiano e inglese non hanno la stessa struttura: stessi titoli allo
//     stesso livello e con gli stessi numeri, stessi elenchi, stesso codice,
//     stesse figure e stesso codice citato nel testo. Il testo delle slide
//     (le citazioni) e' in inglese in tutte e due le lingue, identico;
//   - una figura manca, ha misure diverse da quelle scritte nel testo, o c'e'
//     una figura che nessuna lezione usa;
//   - nel testo e' rimasto un trattino lungo, una tabulazione o un segnaposto
//     della traduzione.
//
// Da riga di comando: node build/ssa-notes.js (con --en controlla solo
// l'inglese, per quando una traduzione e' a meta').
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseNotes, plainText, withoutCode } from '../src/pages/ssa/parseNotes.js';
import { SSA_LECTURES } from '../src/config/ssa.js';

const NOTES = fileURLToPath(new URL('../src/pages/ssa/notes/', import.meta.url));
const FIGURES = fileURLToPath(new URL('../public/images/ssa/', import.meta.url));
const LANGUAGES = ['en', 'it'];
// Trattini lunghi e simili: nel sito si usa solo "-"
const DASHES = /[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/;
// I segnaposto di build/ssa-import.js, se una traduzione non e' stata fusa
const LEFTOVER = /\u27e6|\u27e7|^@@ /;

/** Larghezza e altezza di un'immagine WebP, lette dalla sua intestazione. */
export function webpSize(buffer) {
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') return null;
  const chunk = buffer.toString('ascii', 12, 16);
  if (chunk === 'VP8X') {
    return { w: 1 + buffer.readUIntLE(24, 3), h: 1 + buffer.readUIntLE(27, 3) };
  }
  if (chunk === 'VP8 ') {
    return { w: buffer.readUInt16LE(26) & 0x3fff, h: buffer.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === 'VP8L') {
    const bits = buffer.readUInt32LE(21);
    return { w: 1 + (bits & 0x3fff), h: 1 + ((bits >> 14) & 0x3fff) };
  }
  return null;
}

// Il codice citato in un testo, nell'ordine in cui compare
function codes(nodes, out = []) {
  for (const node of nodes) {
    if (node.t === 'code') out.push(node.v);
    else if (node.c) codes(node.c, out);
  }
  return out;
}
const sorted = (list) => [...list].sort().join('  ##  ');

// I numeri di un titolo ("Slides 9-10 · ..." e "Slide 9-10 · ...", "(pages
// 2-6)" e "(pagine 2-6)"): la traduzione non li cambia
const numbers = (nodes) => (plainText(nodes).match(/\d+/g) || []).join(',');

// Tutte le figure di un elenco di blocchi, anche dentro citazioni ed elenchi
function figures(blocks, out = []) {
  for (const block of blocks) {
    if (block.type === 'figures') out.push(...block.items);
    else if (block.type === 'quote') figures(block.blocks, out);
    else if (block.type === 'list') block.items.forEach((item) => figures(item.blocks, out));
  }
  return out;
}

// La forma di un blocco, uguale nelle due lingue
function shape(block) {
  switch (block.type) {
    case 'heading':
      return `heading ${block.level}`;
    case 'list':
      return `list ${block.ordered ? `ol ${block.start}` : 'ul'} [${block.items.map((item) => item.blocks.map(shape).join(',')).join('|')}]`;
    case 'table':
      return `table ${block.head.length}x${block.rows.length}`;
    case 'code':
      return `code ${block.lang}`;
    case 'figures':
      return `figures ${block.items.map((f) => `${f.file} ${f.width}% ${f.w}x${f.h}`).join(' ')}`;
    default:
      return block.type;
  }
}

// I testi tradotti di un blocco, a coppie con quelli dell'altra lingua
function texts(block) {
  if (block.type === 'p' || block.type === 'heading') return [block.inline];
  if (block.type === 'list') return block.items.flatMap((item) => [item.inline, ...item.blocks.flatMap(texts)]);
  if (block.type === 'table') return [...block.head, ...block.rows.flat()];
  return [];
}

// Due elenchi di blocchi, uno per lingua, blocco per blocco
function compareBlocks(en, it, where, errors) {
  const n = Math.min(en.length, it.length);
  for (let i = 0; i < n; i += 1) {
    const a = en[i];
    const b = it[i];
    const here = `${where}, blocco ${i + 1}`;
    if (shape(a) !== shape(b)) {
      errors.push(`${here}: in inglese e' "${shape(a)}", in italiano "${shape(b)}"`);
      return false;
    }
    // il testo alternativo delle figure si traduce anche dentro una citazione
    const verbatim = (quote) => JSON.stringify(quote, (key, value) => (key === 'alt' ? undefined : value));
    if (a.type === 'quote' && verbatim(a) !== verbatim(b)) {
      errors.push(`${here}: il testo della slide (la citazione) non e' identico nelle due lingue`);
    }
    if (a.type === 'code' && a.text !== b.text) errors.push(`${here}: il codice e' diverso nelle due lingue`);
    if (a.type === 'heading' && numbers(a.inline) !== numbers(b.inline)) {
      errors.push(`${here}: i numeri del titolo sono diversi\n      en: ${plainText(a.inline)}\n      it: ${plainText(b.inline)}`);
    }
    if (a.type === 'list') {
      for (let k = 0; k < a.items.length; k += 1) {
        if (!compareBlocks(a.items[k].blocks, b.items[k].blocks, `${here}, voce ${k + 1}`, errors)) return false;
      }
    }
    const ta = texts(a);
    const tb = texts(b);
    for (let k = 0; k < ta.length; k += 1) {
      const ca = codes(ta[k]);
      const cb = codes(tb[k]);
      if (sorted(ca) !== sorted(cb)) {
        errors.push(`${here} (${a.type}): il codice citato nel testo e' diverso\n      en: ${ca.join(' | ')}\n      it: ${cb.join(' | ')}`);
      }
    }
  }
  if (en.length !== it.length) {
    errors.push(`${where}: ${en.length} blocchi in inglese, ${it.length} in italiano`);
    return false;
  }
  return true;
}

function checkFile(name, errors) {
  const source = readFileSync(NOTES + name, 'utf8');
  let fence = false;
  source.split('\n').forEach((line, i) => {
    if (DASHES.test(line)) errors.push(`${name}:${i + 1}: un trattino lungo o simile, al posto di "-"`);
    if (line.includes('\t')) errors.push(`${name}:${i + 1}: una tabulazione`);
    if (LEFTOVER.test(line)) errors.push(`${name}:${i + 1}: un segnaposto della traduzione`);
    if (line.startsWith('%%')) errors.push(`${name}:${i + 1}: un punto ancora da rivedere (%%)`);
    if (line.startsWith('```')) fence = !fence;
    // In italiano "l'" seguito da virgolette ("l'"assume breach"") farebbe
    // chiudere le virgolette invece di aprirle: in inglese quella coppia e'
    // un apice che chiude, quindi la regola non puo' cambiare; si riformula
    else if (!fence && name.endsWith('.it.md') && !line.startsWith('>') && /'"/.test(withoutCode(line))) {
      errors.push(`${name}:${i + 1}: un apostrofo seguito da virgolette: riformulare la frase`);
    }
  });
  try {
    const doc = parseNotes(source);
    if (!doc.sections.length) errors.push(`${name}: nessun argomento "## "`);
    return doc;
  } catch (error) {
    errors.push(`${name}: ${error.message}`);
    return null;
  }
}

/** Controlla tutti gli appunti; lancia un errore che elenca cio' che non va. */
export function checkNotes({ languages = LANGUAGES } = {}) {
  const errors = [];
  const expected = new Set();
  const used = new Set();
  const sizes = new Map();
  for (const lecture of SSA_LECTURES) {
    const docs = {};
    for (const language of languages) {
      const name = `${lecture.file}.${language}.md`;
      expected.add(name);
      if (!existsSync(NOTES + name)) errors.push(`${name}: manca il file della lezione "${lecture.slug}"`);
      else docs[language] = checkFile(name, errors);
      for (const field of ['title', 'description']) {
        const value = lecture[field] && lecture[field][language];
        if (!value) errors.push(`${lecture.slug}: manca ${field}.${language} in src/config/ssa.js`);
        else if (DASHES.test(value)) errors.push(`${lecture.slug}: un trattino lungo in ${field}.${language}`);
      }
    }
    for (const language of languages) {
      if (!docs[language]) continue;
      for (const figure of figures(docs[language].blocks)) {
        used.add(figure.file);
        if (!sizes.has(figure.file)) {
          const path = FIGURES + figure.file;
          sizes.set(figure.file, existsSync(path) ? webpSize(readFileSync(path)) : null);
        }
        const size = sizes.get(figure.file);
        if (!size) errors.push(`${lecture.file}.${language}.md: manca la figura public/images/ssa/${figure.file} (o non e' un WebP)`);
        else if (size.w !== figure.w || size.h !== figure.h) {
          errors.push(`${lecture.file}.${language}.md: ${figure.file} misura ${size.w}x${size.h}, nel testo ${figure.w}x${figure.h}`);
        }
      }
    }
    if (docs.en && docs.it) compareBlocks(docs.en.blocks, docs.it.blocks, lecture.file, errors);
  }
  for (const name of readdirSync(NOTES)) {
    if (name.endsWith('.md') && languages.some((l) => name.endsWith(`.${l}.md`)) && !expected.has(name)) {
      errors.push(`${name}: non appartiene a nessuna lezione di src/config/ssa.js`);
    }
  }
  if (existsSync(FIGURES)) {
    for (const name of readdirSync(FIGURES)) {
      if (!used.has(name)) errors.push(`public/images/ssa/${name}: nessuna lezione usa questa figura`);
    }
  }
  if (errors.length) {
    const shown = errors.slice(0, 40);
    const more = errors.length > shown.length ? `\n  ... e altri ${errors.length - shown.length}` : '';
    throw new Error(`ssa-notes: ${errors.length} problemi negli appunti\n  ${shown.join('\n  ')}${more}`);
  }
  return SSA_LECTURES.length;
}

export default function ssaNotes() {
  return {
    name: 'ssa-notes',
    apply: 'build',
    buildStart() {
      checkNotes();
    },
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const languages = process.argv.includes('--en') ? ['en'] : LANGUAGES;
  try {
    console.log(`ssa-notes: ${checkNotes({ languages })} lezioni (${languages.join(', ')}), tutto a posto`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
