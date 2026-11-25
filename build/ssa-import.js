// build/ssa-import.js
// Gli strumenti per portare nel sito la bobina del corso di Security in
// Software Applications (un unico Markdown in inglese, lezione per lezione,
// con le figure in PNG) e per tenerne allineata la traduzione italiana. Non
// fa parte della build: si lancia a mano.
//
//   node build/ssa-import.js import <bobina.md> <cartella delle figure>
//       Scrive src/pages/ssa/notes/<file>.en.md per ogni lezione della bobina
//       e converte le sue figure in WebP (larghe al piu' 1400 px) in
//       public/images/ssa, con ImageMagick. Rispetto alla bobina: i titoli
//       scendono di un livello, i trattini lunghi diventano "-", il nome del
//       file PDF lascia il posto al numero di pagine e le slide del titolo
//       perdono i contatti del docente. I file .it.md non si toccano.
//
//   node build/ssa-import.js units <file>
//       Stampa i testi da tradurre di <file>.en.md (es. lecture-05), uno per
//       blocco con il suo numero: titoli, paragrafi, voci di elenco e righe di
//       tabella. Citazioni, codice e figure restano fuori: sono uguali nelle
//       due lingue.
//
//   node build/ssa-import.js merge <file> <testi tradotti>
//       Rimette i testi tradotti (stesso formato e stessi numeri) nello
//       scheletro del file inglese e scrive <file>.it.md. Un testo "=" resta
//       quello inglese (i titoli delle slide, che sono del docente). Si ferma
//       se manca un testo, se una riga di tabella ha un'altra quantita' di
//       celle, se un titolo cambia i suoi numeri o se il codice citato non e'
//       lo stesso.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseInline, splitRow } from '../src/pages/ssa/parseNotes.js';
import { webpSize } from './ssa-notes.js';

const NOTES = fileURLToPath(new URL('../src/pages/ssa/notes/', import.meta.url));
const FIGURES = fileURLToPath(new URL('../public/images/ssa/', import.meta.url));
const MAX_WIDTH = 1400;
const QUALITY = 80;
const DASHES = /[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/;

const LECTURE = /^## Lecture (\d+)( \(part (\d+)\))? · /;
const CONTACT = /^> Daniele Friolo · friolo@di\.uniroma1\.it · https:\/\/danielefriolo\.github\.io$/;
const SOURCE = /Source: "[^"]+", (\d+) pages/;
const IMG = /<img src="immagini\/([^"]+)\.png" alt="([^"]*)" width="(\d+)%">/g;
// Le frasi della bobina che rimandano ai contatti tolti dalle slide del titolo
const EDITS = [
  ['Office hours are by appointment: write to the e-mail address on Slide 4.', 'Office hours are by appointment.'],
];

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

// Il nome dei file di una lezione: lecture-05, e lecture-19-2 per la seconda parte
const fileName = (n, part) => `lecture-${String(n).padStart(2, '0')}${part ? `-${part}` : ''}`;

// Un trattino lungo (U+2013 o U+2014) in testa a una riga resta un carattere, non diventa
// una voce di elenco; fra due cifre e' un intervallo; altrove un trattino
function fixDashes(line) {
  return line
    .replace(/^(>? *)[\u2013\u2014] /, '$1\\- ')
    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-');
}

function convertFigure(name, source) {
  mkdirSync(FIGURES, { recursive: true });
  const target = `${FIGURES}${name}.webp`;
  if (!existsSync(target)) {
    const run = spawnSync('magick', [source, '-strip', '-resize', `${MAX_WIDTH}x>`, '-quality', String(QUALITY), '-define', 'webp:method=6', target]);
    if (run.status !== 0) fail(`ImageMagick non converte ${source}: ${run.stderr}`);
  }
  const size = webpSize(readFileSync(target));
  if (!size) fail(`${target}: non e' un WebP leggibile`);
  return size;
}

function importBobina(bobina, figuresDir) {
  const lines = readFileSync(bobina, 'utf8').replace(/\r\n?/g, '\n').split('\n');
  const starts = [];
  lines.forEach((line, i) => {
    const m = line.match(LECTURE);
    if (m) starts.push({ at: i, n: Number(m[1]), part: m[3] ? Number(m[3]) : 0 });
  });
  if (!starts.length) fail('nessuna "## Lecture N · Titolo" nella bobina');
  const counts = { contacts: 0, edits: EDITS.map(() => 0), figures: 0 };
  for (let k = 0; k < starts.length; k += 1) {
    const { at, n, part } = starts[k];
    const end = k + 1 < starts.length ? starts[k + 1].at : lines.length;
    const body = lines.slice(at + 1, end);
    const out = [];
    let fence = false;
    for (let i = 0; i < body.length; i += 1) {
      let line = body[i];
      // i contatti del docente, con la riga vuota della citazione che li precede
      if (CONTACT.test(line)) {
        if (out.length && out[out.length - 1] === '>') out.pop();
        counts.contacts += 1;
        continue;
      }
      if (line.startsWith('```')) fence = !fence;
      else if (fence) {
        // dentro il codice un "#" e' codice, non un titolo
      } else if (line.startsWith('#### ')) line = line.slice(1);
      else if (line.startsWith('### ')) line = line.slice(1);
      else if (/^#{1,2} /.test(line)) fail(`${fileName(n, part)}: un titolo di primo o secondo livello dentro la lezione: ${line}`);
      // "&#91;" e' una parentesi quadra che la bobina scrive come entita' HTML
      line = line.replace(SOURCE, 'The slide deck has $1 pages').replace(/&#91;/g, '\\[');
      EDITS.forEach(([from, to], e) => {
        if (line.includes(from)) {
          line = line.replace(from, to);
          counts.edits[e] += 1;
        }
      });
      line = fixDashes(line).replace(IMG, (all, name, alt, width) => {
        const size = convertFigure(name, `${figuresDir}/${name}.png`);
        counts.figures += 1;
        return `![${alt}](${name}.webp "${width}% ${size.w}x${size.h}")`;
      });
      if (line.includes('<img')) fail(`${fileName(n, part)}: un'immagine scritta in un modo che non conosco: ${line}`);
      out.push(line.trimEnd());
    }
    while (out.length && out[0] === '') out.shift();
    while (out.length && out[out.length - 1] === '') out.pop();
    const name = `${fileName(n, part)}.en.md`;
    writeFileSync(NOTES + name, `${out.join('\n')}\n`);
    console.log(`${name}: ${out.length} righe`);
  }
  console.log(`contatti del docente tolti: ${counts.contacts}; figure: ${counts.figures}`);
  EDITS.forEach(([from], e) => {
    if (counts.edits[e] !== 1) fail(`la frase "${from}" e' stata trovata ${counts.edits[e]} volte invece di una`);
  });
}

// ---------- testi da tradurre ----------

const ITEM = /^( *)(-|\d+\.) +(.*)$/;
const HEADING = /^(#{2,3}) (.*)$/;
const ALIGN_ROW = /^\|( *:?-+:? *\|)+$/;
const MARK = (id) => `\u27e6${id}\u27e7`;

/** Lo scheletro di un file inglese e i suoi testi da tradurre. */
export function extractUnits(source) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const skeleton = [];
  const units = [];
  let fence = false;
  const unit = (kind, prefix, text) => {
    units.push({ id: units.length + 1, kind, text });
    skeleton.push(`${prefix}${MARK(units.length)}`);
  };
  for (const line of lines) {
    const heading = line.match(HEADING);
    const item = line.match(ITEM);
    if (fence) {
      if (line.startsWith('```')) fence = false;
      skeleton.push(line);
    } else if (line.startsWith('```')) {
      fence = true;
      skeleton.push(line);
    } else if (line.trim() === '' || line.startsWith('>') || line.startsWith('![')) {
      skeleton.push(line);
    } else if (heading) {
      unit('h', `${heading[1]} `, heading[2]);
    } else if (line.startsWith('|')) {
      if (ALIGN_ROW.test(line.trim())) skeleton.push(line);
      else unit('row', '', line);
    } else if (item) {
      unit('li', `${item[1]}${item[2]} `, item[3]);
    } else {
      const indent = line.length - line.trimStart().length;
      unit('p', ' '.repeat(indent), line.trim());
    }
  }
  return { skeleton, units };
}

const codes = (text) => {
  const out = [];
  const walk = (nodes) => nodes.forEach((node) => {
    if (node.t === 'code') out.push(node.v);
    else if (node.c) walk(node.c);
  });
  walk(parseInline(text));
  return out.sort().join('  ##  ');
};
const numbers = (text) => (text.match(/\d+/g) || []).join(',');

function printUnits(file) {
  const { units } = extractUnits(readFileSync(`${NOTES}${file}.en.md`, 'utf8'));
  process.stdout.write(units.map((u) => `@@ ${u.id} ${u.kind}\n${u.text}\n`).join('\n'));
}

function readUnits(path) {
  const map = new Map();
  let current = null;
  readFileSync(path, 'utf8').replace(/\r\n?/g, '\n').split('\n').forEach((line, i) => {
    const head = line.match(/^@@ (\d+) (\w+)$/);
    if (head) {
      current = { id: Number(head[1]), kind: head[2], lines: [], at: i + 1 };
      if (map.has(current.id)) fail(`${path}:${i + 1}: il testo ${current.id} compare due volte`);
      map.set(current.id, current);
    } else if (current) {
      current.lines.push(line);
    } else if (line.trim()) {
      fail(`${path}:${i + 1}: testo prima del primo "@@ "`);
    }
  });
  return map;
}

function merge(file, translated) {
  const { skeleton, units } = extractUnits(readFileSync(`${NOTES}${file}.en.md`, 'utf8'));
  const map = readUnits(translated);
  const errors = [];
  const texts = new Map();
  for (const u of units) {
    const t = map.get(u.id);
    if (!t) {
      errors.push(`${u.id} (${u.kind}): manca la traduzione`);
      continue;
    }
    map.delete(u.id);
    const body = t.lines.filter((line) => line.trim());
    if (t.kind !== u.kind) errors.push(`${u.id}: e' "${u.kind}" in inglese e "${t.kind}" nella traduzione`);
    if (body.length !== 1) {
      errors.push(`${u.id} (riga ${t.at}): ${body.length} righe di testo invece di una`);
      continue;
    }
    // "=" tiene il testo inglese: un titolo di slide (in italiano "Slide" anche
    // al plurale), una riga di soli numeri o codice, un nome
    const text = body[0].trim() === '=' ? u.text.replace(/^Slides /, u.kind === 'h' ? 'Slide ' : 'Slides ') : body[0].trim();
    if (DASHES.test(text)) errors.push(`${u.id} (riga ${t.at}): un trattino lungo`);
    if (u.kind === 'row' && splitRow(text).length !== splitRow(u.text).length) errors.push(`${u.id} (riga ${t.at}): la riga di tabella ha un'altra quantita' di celle`);
    if (u.kind === 'h' && numbers(text.replace(/`[^`]*`/g, '')) !== numbers(u.text.replace(/`[^`]*`/g, ''))) errors.push(`${u.id} (riga ${t.at}): i numeri del titolo sono cambiati: ${text}`);
    try {
      if (codes(text) !== codes(u.text)) errors.push(`${u.id} (riga ${t.at}): il codice citato e' diverso\n      en: ${codes(u.text)}\n      it: ${codes(text)}`);
    } catch (error) {
      errors.push(`${u.id} (riga ${t.at}): ${error.message}`);
    }
    texts.set(u.id, text);
  }
  for (const extra of map.keys()) errors.push(`${extra}: un testo che il file inglese non ha`);
  if (errors.length) fail(`${file}: ${errors.length} problemi nella traduzione\n  ${errors.join('\n  ')}`);
  const out = skeleton.map((line) => line
    .replace(/\u27e6(\d+)\u27e7/, (all, id) => texts.get(Number(id)))
    .replace(/!\[Lecture (\d+), page (\d+)/g, '![Lezione $1, pagina $2'));
  writeFileSync(`${NOTES}${file}.it.md`, out.join('\n'));
  console.log(`${file}.it.md: ${units.length} testi tradotti`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'import' && args.length === 2) importBobina(args[0], args[1]);
  else if (command === 'units' && args.length === 1) printUnits(args[0]);
  else if (command === 'merge' && args.length === 2) merge(args[0], args[1]);
  else fail('uso: node build/ssa-import.js import <bobina.md> <figure> | units <file> | merge <file> <testi>');
}
