// build/reti-doc.js
// Le pagine del laboratorio di Reti di Calcolatori mostrano i file .txt del
// laboratorio impaginati: ogni src/pages/reti/doc/*.lab e' il suo .txt in
// src/pages/reti/lab con in piu' i blocchi (@term, @code, @analysis, ...), i
// titoli "## ...", qualche riga vuota e gli apici inversi del codice citato.
// Le parole devono restare quelle, nello stesso ordine: se un file del
// laboratorio cambia e la sua pagina no, la build si ferma e dice dove.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const LAB = fileURLToPath(new URL('../src/pages/reti/lab/', import.meta.url));
const DOC = fileURLToPath(new URL('../src/pages/reti/doc/', import.meta.url));

const RULE = /^\s*[-=]{8,}\s*$/;
const PLUS_TITLE = /^\s*\+{3,}\s*(.+?)\s*\+{3,}\s*$/;
const ANALYSIS_TAG = /^\s*\[\/?Analisi[^\]]*\]\s*$/;
const BLOCKS = new Set(['@banner', '@term', '@code', '@cmds', '@goal', '@analysis']);
const LINES = new Set(['@author', '@sep', '@sub']);

// Virgolette, apici inversi e "#" sono solo segni di impaginazione
const words = (lines) => lines.join(' ').replace(/["`#]/g, '').split(/\s+/).filter(Boolean);

// Il testo del file del laboratorio, senza righe di trattini e tag di analisi
function txtWords(text) {
  return words(text.split('\n').flatMap((line) => {
    if (RULE.test(line) || ANALYSIS_TAG.test(line)) return [];
    const title = line.match(PLUS_TITLE);
    return [title ? title[1] : line];
  }));
}

// Il testo della pagina impaginata, senza i segni dei blocchi
function labWords(text, name) {
  const open = [];
  const kept = [];
  for (const line of text.split('\n')) {
    if (line.startsWith('@')) {
      const word = line.split(/\s/)[0];
      if (word === '@end') {
        if (!open.pop()) throw new Error(`reti-doc: ${name}: un @end di troppo`);
      } else if (LINES.has(word)) {
        kept.push(line.slice(word.length));
      } else if (BLOCKS.has(word)) {
        open.push(word);
      } else {
        throw new Error(`reti-doc: ${name}: blocco sconosciuto "${line}"`);
      }
      continue;
    }
    let content = line.replace(/^#{2,3} /, '');
    if (open[open.length - 1] === '@term') {
      if (content !== '|' && content !== '' && !['$ ', '| ', '# '].includes(content.slice(0, 2))) {
        throw new Error(`reti-doc: ${name}: riga di terminale senza "$ ", "| " o "# ": ${line}`);
      }
      content = content.slice(2);
    }
    if (!RULE.test(content)) kept.push(content);
  }
  if (open.length) throw new Error(`reti-doc: ${name}: ${open.join(', ')} senza @end`);
  return words(kept);
}

export default function retiDoc() {
  return {
    name: 'reti-doc',
    apply: 'build',
    buildStart() {
      for (const file of readdirSync(LAB).filter((f) => f.endsWith('.txt'))) {
        const name = file.replace(/\.txt$/, '.lab');
        const a = txtWords(readFileSync(LAB + file, 'utf8'));
        const b = labWords(readFileSync(DOC + name, 'utf8'), name);
        const at = a.findIndex((w, i) => w !== b[i]);
        if (at !== -1 || a.length !== b.length) {
          const k = at === -1 ? Math.min(a.length, b.length) : at;
          throw new Error(`reti-doc: ${name} non corrisponde a ${file} dalla parola ${k}:\n`
            + `  ${file}: ${a.slice(k, k + 8).join(' ')}\n  ${name}: ${b.slice(k, k + 8).join(' ')}`);
        }
      }
    },
  };
}
