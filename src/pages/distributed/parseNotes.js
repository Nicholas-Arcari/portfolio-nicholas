// src/pages/distributed/parseNotes.js
// Il formato degli appunti di Distributed Systems. Ogni lezione sta in due
// file, notes/lecture-NN.en.md e notes/lecture-NN.it.md, con la stessa
// struttura nelle due lingue (lo controlla la build, in
// build/distributed-notes.js). E' un Markdown ridotto a quello che serve:
//
//   ## Titolo                 una sezione: voce in grassetto dell'indice
//   ### Titolo                una sottosezione: voce rientrata dell'indice
//   testo                     un paragrafo: righe consecutive, fino a una vuota
//   - voce / 1. voce          un elenco; due spazi di rientro per annidarlo
//   $$ ... $$                 una formula a se', su una o piu' righe
//   ``` etichetta ... ```     uno pseudo-codice, con la sua etichetta in testa
//   | a | b |                 una tabella: intestazione, riga di trattini, righe
//
// Dentro il testo: **grassetto**, *corsivo*, `codice`, $formula$ e
// $$formula$$ (che va a capo da sola anche in mezzo a un paragrafo). Una
// barra rovesciata toglie il significato a $ * ` e alla barra stessa.
// Titolo e descrizione della lezione stanno in src/config/distributed.js.
//
// Questo file non usa ne' React ne' il browser: lo leggono sia la pagina sia
// il controllo della build.

const ESCAPABLE = '\\$*`';

// Dove finisce la formula o il codice che comincia in `i`: l'indice del
// primo carattere dopo il segno di chiusura, e il contenuto
function span(text, i) {
  if (text[i] === '`') {
    const end = text.indexOf('`', i + 1);
    return end === -1 ? null : { type: 'code', value: text.slice(i + 1, end), next: end + 1 };
  }
  const mark = text.startsWith('$$', i) ? '$$' : '$';
  let j = i + mark.length;
  while (j < text.length) {
    if (text[j] === '\\') {
      j += 2;
    } else if (text.startsWith(mark, j)) {
      return { type: mark === '$$' ? 'dmath' : 'math', value: text.slice(i + mark.length, j).trim(), next: j + mark.length };
    } else {
      j += 1;
    }
  }
  return null;
}

// La chiusura di un grassetto o di un corsivo, saltando formule e codice
function closing(text, from, mark) {
  let i = from;
  while (i < text.length) {
    const c = text[i];
    if (c === '\\') {
      i += 2;
    } else if (c === '$' || c === '`') {
      const s = span(text, i);
      if (!s) return -1;
      i = s.next;
    } else if (c === '*') {
      const double = text[i + 1] === '*';
      if (mark === '**') {
        if (double) return i;
        i += 1;
      } else {
        if (!double) return i;
        // un grassetto dentro il corsivo: si salta per intero
        const end = closing(text, i + 2, '**');
        if (end === -1) return -1;
        i = end + 2;
      }
    } else {
      i += 1;
    }
  }
  return -1;
}

const isLetter = (c) => /\p{L}|\p{N}/u.test(c);

// Apostrofi e virgolette tipografici, come nei testi di Statistics. `state`
// ricorda l'ultimo carattere scritto anche attraverso grassetti e formule
function typography(text, state) {
  let out = '';
  for (const c of text) {
    if (c === "'") {
      out += isLetter(state.prev) || state.prev === '\u2019' ? '\u2019' : '\u2018';
    } else if (c === '"') {
      out += /[\s([{]/.test(state.prev) || state.prev === '' ? '\u201c' : '\u201d';
    } else {
      out += c;
    }
    state.prev = c;
  }
  return out;
}

/** Il testo di un paragrafo, di una voce o di un titolo, a pezzi. */
export function parseInline(text, state = { prev: '' }) {
  const out = [];
  let buffer = '';
  const flush = () => {
    if (buffer) out.push({ t: 'text', v: typography(buffer, state) });
    buffer = '';
  };
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === '\\' && i + 1 < text.length && ESCAPABLE.includes(text[i + 1])) {
      buffer += text[i + 1];
      i += 2;
    } else if (c === '`' || c === '$') {
      const s = span(text, i);
      if (!s) throw new Error(`segno "${c}" non chiuso: ${text.slice(i, i + 60)}`);
      flush();
      out.push({ t: s.type, v: s.value });
      state.prev = 'x';
      i = s.next;
    } else if (c === '*') {
      const mark = text[i + 1] === '*' ? '**' : '*';
      const end = closing(text, i + mark.length, mark);
      if (end === -1) throw new Error(`segno "${mark}" non chiuso: ${text.slice(i, i + 60)}`);
      flush();
      out.push({ t: mark === '**' ? 'strong' : 'em', c: parseInline(text.slice(i + mark.length, end), state) });
      i = end + mark.length;
    } else {
      buffer += c;
      i += 1;
    }
  }
  flush();
  return out;
}

/** Lo stesso testo senza segni: per cercare e per confrontare le lingue. */
export const plainText = (nodes) => nodes.map((n) => (n.c ? plainText(n.c) : n.v)).join('');

const HEADING = /^(#{2,3}) +(.+)$/;
const ITEM = /^( *)(-|\d+\.) +(.+)$/;
const FENCE = '```';
const isRow = (line) => line.startsWith('|');
const isSpecial = (line) => HEADING.test(line) || ITEM.test(line) || line.startsWith(FENCE) || line.startsWith('$$') || isRow(line);

// Le voci di un elenco dal loro rientro: una voce piu' rientrata della
// precedente apre un elenco dentro di lei
function buildList(items, at, indent) {
  const first = items[at];
  const list = { type: 'list', ordered: first.marker !== '-', start: parseInt(first.marker, 10) || 1, items: [] };
  let i = at;
  while (i < items.length && items[i].indent >= indent) {
    if (items[i].indent > indent) {
      const [nested, next] = buildList(items, i, items[i].indent);
      if (!list.items.length) throw new Error('una voce rientrata senza una voce sopra');
      list.items[list.items.length - 1].lists.push(nested);
      i = next;
    } else {
      list.items.push({ inline: items[i].inline, lists: [] });
      i += 1;
    }
  }
  return [list, i];
}

const cells = (row) => row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => parseInline(cell.trim()));

/**
 * Un file di appunti in blocchi: { blocks, sections }. I blocchi sono
 * 'heading', 'p', 'list', 'math', 'code' e 'table'; `sections` e' l'indice,
 * con i titoli numerati (1., 1.1, ...) e i loro id.
 */
export function parseNotes(source) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  const sections = [];
  let major = 0;
  let minor = 0;
  let i = 0;
  const fail = (message, at) => {
    throw new Error(`riga ${at + 1}: ${message}`);
  };
  // un errore nel testo di un blocco dice anche da che riga comincia
  const inlineAt = (text, at) => {
    try {
      return parseInline(text);
    } catch (error) {
      return fail(error.message, at);
    }
  };
  while (i < lines.length) {
    const line = lines[i];
    const heading = line.match(HEADING);
    if (line.trim() === '') {
      i += 1;
    } else if (line.startsWith(FENCE)) {
      const from = i;
      const body = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith(FENCE)) body.push(lines[i++]);
      if (i === lines.length) fail('pseudo-codice senza chiusura', from);
      i += 1;
      blocks.push({ type: 'code', label: line.slice(FENCE.length).trim(), text: body.join('\n') });
    } else if (line.startsWith('$$') && !/^\$\$.+\$\$\S/.test(line) && !/^\$\$.+\$\$ +\S/.test(line)) {
      // una formula a se': tutta su una riga, oppure fra due righe "$$"
      const from = i;
      let tex;
      if (line.trim() !== '$$') {
        if (!line.trim().endsWith('$$')) fail('formula senza chiusura', from);
        tex = line.trim().slice(2, -2);
        i += 1;
      } else {
        const body = [];
        i += 1;
        while (i < lines.length && lines[i].trim() !== '$$') body.push(lines[i++]);
        if (i === lines.length) fail('formula senza chiusura', from);
        i += 1;
        tex = body.join('\n');
      }
      blocks.push({ type: 'math', tex: tex.trim() });
    } else if (heading) {
      const level = heading[1].length - 2;
      if (level === 0) {
        major += 1;
        minor = 0;
      } else {
        if (major === 0) fail('una sottosezione prima di ogni sezione', i);
        minor += 1;
      }
      const number = level === 0 ? `${major}.` : `${major}.${minor}`;
      const id = level === 0 ? `ds-${major}` : `ds-${major}-${minor}`;
      const inline = inlineAt(heading[2], i);
      blocks.push({ type: 'heading', level, id, number, inline });
      sections.push({ id, level, number, inline });
      i += 1;
    } else if (ITEM.test(line)) {
      const items = [];
      while (i < lines.length && ITEM.test(lines[i])) {
        const m = lines[i].match(ITEM);
        if (m[1].length % 2) fail('rientro di un elenco non multiplo di due spazi', i);
        items.push({ indent: m[1].length, marker: m[2], inline: inlineAt(m[3], i) });
        i += 1;
      }
      if (items[0].indent !== 0) fail('un elenco comincia senza rientro', i - items.length);
      let at = 0;
      while (at < items.length) {
        const [list, next] = buildList(items, at, 0);
        blocks.push(list);
        at = next;
      }
    } else if (isRow(line)) {
      const from = i;
      const rows = [];
      while (i < lines.length && isRow(lines[i])) rows.push(lines[i++]);
      if (rows.length < 3 || !/^\|[\s:|-]+\|$/.test(rows[1].trim())) fail('tabella senza la riga di trattini sotto l\'intestazione', from);
      try {
        blocks.push({ type: 'table', head: cells(rows[0]), rows: rows.slice(2).map(cells) });
      } catch (error) {
        fail(error.message, from);
      }
    } else {
      const from = i;
      const text = [];
      while (i < lines.length && lines[i].trim() !== '' && !(i > from && isSpecial(lines[i]))) text.push(lines[i++].trim());
      blocks.push({ type: 'p', inline: inlineAt(text.join(' '), from) });
    }
  }
  return { blocks, sections };
}
