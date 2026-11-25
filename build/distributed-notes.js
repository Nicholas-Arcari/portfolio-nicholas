// build/distributed-notes.js
// Gli appunti di Distributed Systems stanno in src/pages/distributed/notes,
// due file per lezione (lecture-NN.en.md e lecture-NN.it.md), nel formato
// descritto in src/pages/distributed/parseNotes.js. La build si ferma se:
//
//   - una lezione dell'elenco (src/config/distributed.js) non ha i suoi due
//     file, o c'e' un file che non appartiene a nessuna lezione;
//   - un file non si legge (un segno non chiuso, un elenco rientrato male);
//   - una formula non e' LaTeX che KaTeX sa impaginare, o produce un
//     attributo style, che la Content Security Policy del sito bloccherebbe;
//   - italiano e inglese non hanno la stessa struttura: stessi titoli allo
//     stesso livello, stessi elenchi, stesse formule e stesso codice in ogni
//     blocco. Una traduzione che perde un paragrafo o una formula non passa;
//   - nel testo e' rimasto un trattino lungo o un segnaposto "image".
//
// katexFonts toglie dal CSS di KaTeX i font in woff e ttf: ogni browser in
// uso legge woff2, e cosi' il sito pubblicato pesa circa 900 kB in meno.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import katex from 'katex';
import { parseNotes } from '../src/pages/distributed/parseNotes.js';
import { DS_LECTURES } from '../src/config/distributed.js';

const NOTES = fileURLToPath(new URL('../src/pages/distributed/notes/', import.meta.url));
const LANGUAGES = ['en', 'it'];
// Trattini lunghi e simili: nel sito si usa solo "-"
const DASHES = /[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/;
const PLACEHOLDER = /^\s*\[?(image|immagine)\]?\s*$/i;

// Dentro \text{...} le parole possono essere tradotte: per il confronto fra
// le lingue conta il resto della formula
const formula = (tex) => tex.replace(/\\text\{[^{}]*\}/g, '\\text{}').replace(/\s+/g, ' ').trim();

// Formule e codice citati in un testo, nell'ordine in cui compaiono
function marks(nodes, out = { math: [], code: [] }) {
  for (const node of nodes) {
    if (node.t === 'math' || node.t === 'dmath') out.math.push(formula(node.v));
    else if (node.t === 'code') out.code.push(node.v);
    else if (node.c) marks(node.c, out);
  }
  return out;
}

// Tutti i testi di un blocco: il suo, o quelli delle voci e delle celle
function texts(block) {
  if (block.type === 'p' || block.type === 'heading') return [block.inline];
  if (block.type === 'list') return block.items.flatMap((item) => [item.inline, ...item.lists.flatMap(texts)]);
  if (block.type === 'table') return [...block.head, ...block.rows.flat()];
  return [];
}

// La forma di un blocco, uguale nelle due lingue
function shape(block) {
  if (block.type === 'heading') return `heading ${block.level}`;
  if (block.type === 'list') return `list ${block.ordered ? 'ol' : 'ul'} [${block.items.map((item) => item.lists.map(shape).join(',')).join('|')}]`;
  if (block.type === 'table') return `table ${block.head.length}x${block.rows.length}`;
  return block.type;
}

// Le formule distinte di un testo: l'italiano omette volentieri un soggetto
// che l'inglese ripete ("$p_1$ knows ... $p_1$ attacks"), quindi conta quali
// formule ci sono, non quante volte
const sorted = (list) => [...new Set(list)].sort().join('  ##  ');

// Una formula deve essere LaTeX valido e non portare attributi style
function checkTex(tex, display, where, errors) {
  try {
    const html = katex.renderToString(tex, { displayMode: display, throwOnError: true, strict: 'error' });
    if (/<(svg|m[a-z]+)\b[^>]*\sstyle=/.test(html)) {
      errors.push(`${where}: la formula produce un attributo style, bloccato dalla CSP: ${tex}`);
    }
  } catch (error) {
    errors.push(`${where}: formula non valida: ${tex}\n      ${error.message}`);
  }
}

function checkFile(name, errors) {
  const source = readFileSync(NOTES + name, 'utf8');
  source.split('\n').forEach((line, i) => {
    if (DASHES.test(line)) errors.push(`${name}:${i + 1}: un trattino lungo o simile, al posto di "-"`);
    if (PLACEHOLDER.test(line)) errors.push(`${name}:${i + 1}: un segnaposto di immagine`);
    if (line.includes('\t')) errors.push(`${name}:${i + 1}: una tabulazione`);
    if (line.startsWith('%%')) errors.push(`${name}:${i + 1}: un punto ancora da rivedere (%%)`);
  });
  let doc;
  try {
    doc = parseNotes(source);
  } catch (error) {
    errors.push(`${name}: ${error.message}`);
    return null;
  }
  if (!doc.sections.length) errors.push(`${name}: nessuna sezione "## "`);
  doc.blocks.forEach((block, i) => {
    const where = `${name}, blocco ${i + 1} (${block.type})`;
    if (block.type === 'math') checkTex(block.tex, true, where, errors);
    for (const inline of texts(block)) {
      const walk = (nodes) => nodes.forEach((node) => {
        if (node.t === 'math') checkTex(node.v, false, where, errors);
        else if (node.t === 'dmath') checkTex(node.v, true, where, errors);
        else if (node.c) walk(node.c);
      });
      walk(inline);
    }
  });
  return doc;
}

// Le due lingue della stessa lezione, blocco per blocco
function compare(file, en, it, errors) {
  const n = Math.min(en.blocks.length, it.blocks.length);
  for (let i = 0; i < n; i += 1) {
    const a = en.blocks[i];
    const b = it.blocks[i];
    const where = `${file}, blocco ${i + 1}`;
    if (shape(a) !== shape(b)) {
      errors.push(`${where}: in inglese e' "${shape(a)}", in italiano "${shape(b)}"`);
      return;
    }
    if (a.type === 'code' && a.text !== b.text) errors.push(`${where}: lo pseudo-codice e' diverso nelle due lingue`);
    if (a.type === 'math' && formula(a.tex) !== formula(b.tex)) errors.push(`${where}: la formula e' diversa nelle due lingue\n      en: ${a.tex}\n      it: ${b.tex}`);
    const ta = texts(a);
    const tb = texts(b);
    for (let k = 0; k < ta.length; k += 1) {
      const ma = marks(ta[k]);
      const mb = marks(tb[k]);
      if (sorted(ma.math) !== sorted(mb.math)) {
        errors.push(`${where} (${a.type}): le formule nel testo sono diverse nelle due lingue\n      en: ${ma.math.join(' | ')}\n      it: ${mb.math.join(' | ')}`);
      }
      if (sorted(ma.code) !== sorted(mb.code)) {
        errors.push(`${where} (${a.type}): il codice citato nel testo e' diverso nelle due lingue\n      en: ${ma.code.join(' | ')}\n      it: ${mb.code.join(' | ')}`);
      }
    }
  }
  if (en.blocks.length !== it.blocks.length) {
    errors.push(`${file}: ${en.blocks.length} blocchi in inglese, ${it.blocks.length} in italiano`);
  }
}

/** Controlla tutti gli appunti; lancia un errore che elenca cio' che non va. */
export function checkNotes() {
  const errors = [];
  const expected = new Set();
  for (const lecture of DS_LECTURES) {
    const docs = {};
    for (const language of LANGUAGES) {
      const name = `${lecture.file}.${language}.md`;
      expected.add(name);
      if (!existsSync(NOTES + name)) errors.push(`${name}: manca il file della lezione "${lecture.slug}"`);
      else docs[language] = checkFile(name, errors);
      for (const field of ['title', 'description']) {
        const value = lecture[field] && lecture[field][language];
        if (!value) errors.push(`${lecture.slug}: manca ${field}.${language} in src/config/distributed.js`);
        else if (DASHES.test(value)) errors.push(`${lecture.slug}: un trattino lungo in ${field}.${language}`);
      }
    }
    if (docs.en && docs.it) compare(lecture.file, docs.en, docs.it, errors);
  }
  for (const name of readdirSync(NOTES)) {
    if (name.endsWith('.md') && !expected.has(name)) errors.push(`${name}: non appartiene a nessuna lezione di src/config/distributed.js`);
  }
  if (errors.length) {
    const shown = errors.slice(0, 40);
    const more = errors.length > shown.length ? `\n  ... e altri ${errors.length - shown.length}` : '';
    throw new Error(`distributed-notes: ${errors.length} problemi negli appunti\n  ${shown.join('\n  ')}${more}`);
  }
  return DS_LECTURES.length;
}

const katexFonts = () => ({
  name: 'katex-fonts',
  enforce: 'pre',
  transform(code, id) {
    if (!/[\\/]katex[\\/]dist[\\/]katex(\.min)?\.css/.test(id)) return null;
    const trimmed = code.replace(/,\s*url\([^)]*\.woff\)\s*format\("woff"\),\s*url\([^)]*\.ttf\)\s*format\("truetype"\)/g, '');
    // Se KaTeX cambia il suo CSS la build deve dirlo, non pubblicare 60 font
    if (trimmed === code) this.error('katex-fonts: nel CSS di KaTeX non ci sono piu\' i font woff e ttf da togliere');
    return { code: trimmed, map: null };
  },
});

export default function distributedNotes() {
  return [
    {
      name: 'distributed-notes',
      apply: 'build',
      buildStart() {
        checkNotes();
      },
    },
    katexFonts(),
  ];
}

// Da riga di comando: node build/distributed-notes.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    console.log(`distributed-notes: ${checkNotes()} lezioni, tutto a posto`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
