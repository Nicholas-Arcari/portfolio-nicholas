// src/pages/reti/parseLab.js
// Il file .lab di un'esercitazione diviso in blocchi per LabDoc: vedi la
// descrizione del formato in LabDoc.jsx.
import { accents } from './accents';

const DIRECTIVE = /^@(banner|author|sep|sub|goal|analysis|term|code|cmds)(?:\s+(.*))?$/;
const HEADING = /^(#{2,3}) (.+)$/;
const LIST = /^(\s*)([-*+]|\d{1,2}[.)]|[a-z]\))\s+(.*)$/;

const indentOf = (line) => line.length - line.trimStart().length;

// Le righe di un file o di uno schema senza il rientro che hanno in comune
function dedent(lines) {
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
  const cut = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(Math.min(cut, l.match(/^ */)[0].length)));
}

// La riga di un terminale: comando, output o commento
function termRow(line) {
  const kind = { '$ ': 'cmd', '# ': 'comment' }[line.slice(0, 2)] || 'out';
  return { kind, text: line.slice(2) };
}

// "docker images   --->> mostra le immagini": il comando e la sua spiegazione
function cmdRow(line) {
  const [cmd, ...rest] = line.split(/\s*-{2,}>>\s*/);
  return { cmd: cmd.trim(), text: rest.join(' ').trim() };
}

// Le voci di un elenco, annidate secondo il rientro delle righe
function buildList(lines) {
  const root = { indent: -1, items: [] };
  const stack = [root];
  for (const line of lines) {
    const m = line.match(LIST);
    const indent = indentOf(line);
    if (m) {
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
      const item = { indent, marker: m[2], text: m[3].trim(), items: [], after: '' };
      stack[stack.length - 1].items.push(item);
      stack.push(item);
    } else {
      // una riga che continua una voce va alla voce aperta piu' interna fra
      // quelle che cominciano piu' a sinistra di lei
      while (stack.length > 2 && stack[stack.length - 1].indent >= indent) stack.pop();
      const item = stack[stack.length - 1];
      if (item.items.length) item.after = `${item.after} ${line.trim()}`.trim();
      else item.text = `${item.text} ${line.trim()}`;
    }
  }
  return root.items;
}

// Paragrafi ed elenchi dalle righe libere
function parseFree(raw) {
  const lines = raw.map((l) => (/^\s*#/.test(l) ? l.replace(/^\s*#\s?/, '') : l));
  const blocks = [];
  let k = 0;
  while (k < lines.length) {
    if (!lines[k].trim()) {
      k += 1;
    } else if (LIST.test(lines[k])) {
      const base = indentOf(lines[k]);
      const body = [];
      while (k < lines.length) {
        const line = lines[k];
        if (!line.trim()) {
          // le righe vuote fra due voci non chiudono l'elenco
          let j = k;
          while (j < lines.length && !lines[j].trim()) j += 1;
          const next = j < lines.length && lines[j].match(LIST);
          if (next && next[1].length >= base) {
            k = j;
            continue;
          }
          break;
        }
        const m = line.match(LIST);
        if (m ? m[1].length < base : indentOf(line) <= base) break;
        body.push(line);
        k += 1;
      }
      blocks.push({ type: 'list', items: buildList(body) });
    } else {
      const para = [];
      while (k < lines.length && lines[k].trim() && !(para.length && LIST.test(lines[k]))) para.push(lines[k++].trim());
      blocks.push({ type: 'p', text: para.join(' ').replace(/\s+/g, ' ') });
    }
  }
  return blocks;
}

/** Il file .lab diviso in blocchi, con l'elenco dei titoli per l'indice. */
export function parseLab(source) {
  const lines = source.replace(/\n$/, '').split('\n');
  const sections = [];
  let i = 0;

  const readRaw = () => {
    const body = [];
    while (i < lines.length && lines[i] !== '@end') body.push(lines[i++]);
    i += 1;
    return body;
  };

  const parseBlocks = (nested) => {
    const blocks = [];
    let free = [];
    const flush = () => {
      if (free.length) blocks.push(...parseFree(free));
      free = [];
    };
    while (i < lines.length) {
      const line = lines[i];
      if (nested && line === '@end') {
        i += 1;
        break;
      }
      const d = line.match(DIRECTIVE);
      const h = line.match(HEADING);
      if (d) {
        flush();
        i += 1;
        const [, kind, arg = ''] = d;
        if (kind === 'author') blocks.push({ type: 'author', text: arg });
        else if (kind === 'sep') blocks.push({ type: 'sep' });
        else if (kind === 'sub') blocks.push({ type: 'p', text: arg, sub: true });
        else if (kind === 'analysis') blocks.push({ type: 'analysis', title: arg, blocks: parseBlocks(true) });
        else if (kind === 'goal') blocks.push({ type: 'goal', blocks: parseFree(readRaw()) });
        else if (kind === 'term') blocks.push({ type: 'term', rows: readRaw().map(termRow) });
        else if (kind === 'cmds') blocks.push({ type: 'cmds', rows: readRaw().map(cmdRow) });
        else if (kind === 'code') blocks.push({ type: 'code', label: arg, text: dedent(readRaw()).join('\n') });
        else blocks.push({ type: kind, text: readRaw().join('\n') });
      } else if (h) {
        flush();
        const id = `lab-section-${sections.length + 1}`;
        sections.push({ id, title: accents(h[2]), level: h[1].length - 2 });
        blocks.push({ type: 'heading', id, level: h[1].length - 2, text: h[2] });
        i += 1;
      } else {
        free.push(line);
        i += 1;
      }
    }
    flush();
    return blocks;
  };

  return { blocks: parseBlocks(false), sections };
}
