// src/pages/ssa/parseNotes.js
// Il formato degli appunti di Security in Software Applications. Ogni lezione
// sta in due file, notes/lecture-NN.en.md e notes/lecture-NN.it.md, con la
// stessa struttura nelle due lingue (lo controlla la build, in
// build/ssa-notes.js). E' il Markdown della bobina del corso, ridotto a
// quello che serve:
//
//   testo prima del primo "## "   l'introduzione della lezione
//   ## Titolo                     un argomento: voce numerata dell'indice
//   ### Slide N · Titolo          una slide: voce rientrata dell'indice
//   testo                         un paragrafo: righe consecutive, fino a una vuota
//   - voce / 1. voce              un elenco. Le righe rientrate sotto una voce,
//                                 anche dopo una riga vuota, le appartengono: un
//                                 altro paragrafo, un elenco annidato, del codice
//   > testo                       il testo della slide, parola per parola: dentro
//                                 valgono gli stessi blocchi, e ogni riga di un
//                                 paragrafo va a capo come sulla slide
//   ```c ... ```                  del codice, con il suo linguaggio
//   | a | b |                     una tabella: intestazione, riga di trattini, righe
//   ![testo](f.webp "50% 1400x787")  una figura, larga il 50% della colonna, con
//                                 le sue misure in pixel; piu' figure sulla stessa
//                                 riga stanno affiancate
//
// Dentro il testo: **grassetto**, *corsivo*, ***tutti e due***, `codice`
// (anche ``con ` dentro``) e <sup>esponente</sup>, con le regole di CommonMark
// per gli asterischi. Una barra rovesciata davanti a un segno di punteggiatura
// lo scrive com'e' (\* \_ \[ \< ...). Titolo e descrizione della lezione stanno
// in src/config/ssa.js.
//
// Questo file non usa ne' React ne' il browser: lo leggono sia la pagina sia
// il controllo della build.

const ASCII_PUNCT = /[!-/:-@[-`{-~]/;
const isSpace = (c) => c === undefined || /\s/u.test(c);
const isPunct = (c) => c !== undefined && /[\p{P}\p{S}]/u.test(c);
const isLetter = (c) => /\p{L}|\p{N}/u.test(c);
// dopo questi un apice apre sempre: (' [' {' "' e le virgolette già aperte
const OPENERS = /[([{"\u2018\u201c]/;

// Apostrofi e virgolette tipografici, come negli appunti di Distributed
// Systems. `state` ricorda l'ultimo carattere scritto anche attraverso
// grassetti e codice
function typography(text, state) {
  let out = '';
  let at = 0;
  for (const c of text) {
    at += c.length;
    if (c === "'") {
      // '70, '90: l'apostrofo che toglie il secolo, non una virgoletta aperta.
      const rest = text.slice(at);
      const year = /^\d\d(?![\d'])/.test(rest);
      // dopo un segno chiude se poi viene uno spazio, la fine o un altro segno: ';' '.'
      const after = isPunct(state.prev) && !OPENERS.test(state.prev) && (rest === '' || /^[\s\p{P}\p{S}]/u.test(rest));
      out += year || after || isLetter(state.prev) || state.prev === '\u2019' ? '\u2019' : '\u2018';
    } else if (c === '"') {
      out += /[\s([{/\u2018\u201c]/.test(state.prev) || state.prev === '' ? '\u201c' : '\u201d';
    } else {
      out += c;
    }
    state.prev = c;
  }
  return out;
}

// Il codice che comincia in `i` con una fila di accenti gravi: finisce alla
// prima fila lunga uguale. Uno spazio in testa e uno in coda si tolgono,
// come in CommonMark (``con ` dentro`` scrive "con ` dentro")
function codeSpan(text, i) {
  let ticks = 0;
  while (text[i + ticks] === '`') ticks += 1;
  let j = i + ticks;
  while (j < text.length) {
    if (text[j] !== '`') {
      j += 1;
      continue;
    }
    let run = 0;
    while (text[j + run] === '`') run += 1;
    if (run === ticks) {
      let value = text.slice(i + ticks, j);
      if (value.length > 2 && value.startsWith(' ') && value.endsWith(' ') && value.trim()) value = value.slice(1, -1);
      return { value, next: j + run };
    }
    j += run;
  }
  return null;
}

/** Il testo senza il codice citato: per i controlli sulla punteggiatura. */
export function withoutCode(text) {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const span = text[i] === '`' ? codeSpan(text, i) : null;
    if (span) {
      i = span.next;
    } else {
      out += text[i];
      i += 1;
    }
  }
  return out;
}

// Una fila di asterischi puo' aprire se non e' seguita da uno spazio (e, se
// e' seguita da punteggiatura, e' preceduta da spazio o punteggiatura), e
// chiudere nel caso speculare: le regole "left-flanking" e "right-flanking"
// di CommonMark
function delimiter(text, i, count) {
  const before = text[i - 1];
  const after = text[i + count];
  const left = !isSpace(after) && (!isPunct(after) || isSpace(before) || isPunct(before));
  const right = !isSpace(before) && (!isPunct(before) || isSpace(after) || isPunct(after));
  return { t: 'delim', n: count, orig: count, open: left, close: right };
}

// Il testo spezzato in pezzi: testo, codice, esponenti e file di asterischi
function tokenize(text) {
  const out = [];
  let buffer = '';
  const flush = () => {
    if (buffer) out.push({ t: 'text', v: buffer });
    buffer = '';
  };
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === '\\' && ASCII_PUNCT.test(text[i + 1] || '')) {
      buffer += text[i + 1];
      i += 2;
    } else if (c === '`') {
      const span = codeSpan(text, i);
      if (!span) throw new Error(`codice non chiuso: ${text.slice(i, i + 60)}`);
      flush();
      out.push({ t: 'code', v: span.value });
      i = span.next;
    } else if (text.startsWith('<sup>', i)) {
      const end = text.indexOf('</sup>', i);
      if (end === -1) throw new Error(`<sup> non chiuso: ${text.slice(i, i + 60)}`);
      flush();
      out.push({ t: 'sup', c: parseInline(text.slice(i + 5, end)) });
      i = end + 6;
    } else if (c === '*') {
      let count = 0;
      while (text[i + count] === '*') count += 1;
      flush();
      out.push(delimiter(text, i, count));
      i += count;
    } else {
      buffer += c;
      i += 1;
    }
  }
  flush();
  return out;
}

// Gli asterischi che si chiudono a vicenda diventano corsivi e grassetti,
// con l'algoritmo di CommonMark: ogni fila che chiude cerca la piu' vicina
// che apre; due asterischi per parte fanno un grassetto, uno un corsivo
function emphasis(nodes) {
  let i = 0;
  while (i < nodes.length) {
    const closer = nodes[i];
    if (closer.t !== 'delim' || !closer.close || closer.n === 0) {
      i += 1;
      continue;
    }
    let j = i - 1;
    for (; j >= 0; j -= 1) {
      const opener = nodes[j];
      if (opener.t !== 'delim' || !opener.open || opener.n === 0) continue;
      // la "regola del 3" di CommonMark
      const both = opener.close || closer.open;
      if (both && (opener.orig + closer.orig) % 3 === 0 && !(opener.orig % 3 === 0 && closer.orig % 3 === 0)) continue;
      break;
    }
    if (j < 0) {
      i += 1;
      continue;
    }
    const opener = nodes[j];
    const use = opener.n >= 2 && closer.n >= 2 ? 2 : 1;
    opener.n -= use;
    closer.n -= use;
    const inner = nodes.slice(j + 1, i);
    nodes.splice(j + 1, i - j - 1, { t: use === 2 ? 'strong' : 'em', c: inner });
    i = j + 2;
  }
  return nodes;
}

// Gli asterischi rimasti senza compagno restano asterischi, e i testi vicini
// si uniscono
function finish(nodes) {
  const out = [];
  const push = (node) => {
    const last = out[out.length - 1];
    if (node.t === 'text' && last && last.t === 'text') last.v += node.v;
    else out.push(node);
  };
  for (const node of nodes) {
    if (node.t === 'delim') {
      if (node.n) push({ t: 'text', v: '*'.repeat(node.n) });
    } else if (node.c) {
      push({ ...node, c: finish(node.c) });
    } else {
      push(node);
    }
  }
  return out;
}

// Apostrofi e virgolette tipografici, nell'ordine in cui si leggono: un
// corsivo che comincia con una virgoletta dopo del testo la apre
function quotes(nodes, state) {
  for (const node of nodes) {
    if (node.t === 'text') node.v = typography(node.v, state);
    else if (node.t === 'code') state.prev = 'x';
    else if (node.c) quotes(node.c, state);
  }
  return nodes;
}

/** Il testo di un paragrafo, di una voce, di un titolo o di una cella, a pezzi. */
export function parseInline(text, state = { prev: '' }) {
  return quotes(finish(emphasis(tokenize(text))), state);
}

/** Lo stesso testo senza segni: per cercare e per confrontare le lingue. */
export const plainText = (nodes) => nodes.map((n) => (n.c ? plainText(n.c) : n.t === 'br' ? '\n' : n.v)).join('');

const FENCE = '```';
const HEADING = /^(#{2,3}) +(.+?) *$/;
const ITEM = /^( *)(-|\d+\.) +(.*)$/;
const FIGURE = /!\[([^\]]*)\]\(([^\s)"]+) "(\d+)% (\d+)x(\d+)"\)/g;
const isFigureLine = (line) => line.startsWith('![');
const isRow = (line) => line.startsWith('|');
const isQuote = (line) => line.startsWith('>');
const indentOf = (line) => line.length - line.trimStart().length;
const blank = (line) => line.trim() === '';

// Una riga che interrompe un paragrafo
const isSpecial = (line) => line.startsWith(FENCE) || HEADING.test(line) || isQuote(line) || isRow(line) || isFigureLine(line) || ITEM.test(line);

// Le righe di un blocco rientrato, con il rientro comune tolto
function dedent(lines) {
  const indents = lines.filter((line) => !blank(line)).map(indentOf);
  const cut = indents.length ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(Math.min(cut, indentOf(line))));
}

/**
 * Le celle di una riga di tabella: si divide sulle barre che non sono dentro
 * il codice e non sono precedute da una barra rovesciata.
 */
export function splitRow(row) {
  const text = row.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells = [];
  let cell = '';
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === '\\' && i + 1 < text.length) {
      cell += c + text[i + 1];
      i += 2;
    } else if (c === '`') {
      const span = codeSpan(text, i);
      const end = span ? span.next : text.length;
      cell += text.slice(i, end);
      i = end;
    } else if (c === '|') {
      cells.push(cell.trim());
      cell = '';
      i += 1;
    } else {
      cell += c;
      i += 1;
    }
  }
  cells.push(cell.trim());
  return cells;
}

const ALIGN_ROW = /^\|( *:?-+:? *\|)+$/;
const align = (cell) => (cell.startsWith(':') && cell.endsWith(':') ? 'center' : cell.endsWith(':') ? 'right' : null);

/**
 * Un file di appunti in blocchi: { blocks, sections }. I blocchi sono
 * 'heading', 'p', 'list', 'code', 'table', 'quote' e 'figures'; `sections`
 * e' l'indice, con gli argomenti numerati (1., 2., ...) e le slide sotto.
 */
export function parseNotes(source) {
  const sections = [];
  let major = 0;
  let minor = 0;

  // `at` e' la prima riga del blocco nel file: un errore dice dove guardare
  function parseBlocks(lines, at, { top = false, quote = false } = {}) {
    const blocks = [];
    let i = 0;
    const fail = (message, k) => {
      throw new Error(`riga ${at + k + 1}: ${message}`);
    };
    const inline = (text, k) => {
      try {
        return parseInline(text);
      } catch (error) {
        return fail(error.message, k);
      }
    };
    // le righe di un paragrafo dentro una citazione vanno a capo come sulla
    // slide; fuori si uniscono con uno spazio
    const paragraph = (rows, k) => {
      if (!quote) return inline(rows.join(' '), k);
      const state = { prev: '' };
      const out = [];
      rows.forEach((row, r) => {
        if (r) {
          out.push({ t: 'br' });
          state.prev = '\n';
        }
        try {
          out.push(...parseInline(row, state));
        } catch (error) {
          fail(error.message, k + r);
        }
      });
      return out;
    };

    function parseList(start) {
      const first = lines[start].match(ITEM);
      const ordered = first[2] !== '-';
      const list = { type: 'list', ordered, start: ordered ? parseInt(first[2], 10) : 1, items: [] };
      let k = start;
      while (k < lines.length) {
        const m = lines[k].match(ITEM);
        if (!m || m[1].length !== 0 || (m[2] !== '-') !== ordered) break;
        const itemAt = k;
        const sub = [];
        k += 1;
        while (k < lines.length) {
          if (blank(lines[k])) {
            // una riga vuota: la voce continua solo se dopo c'e' una riga rientrata
            let next = k;
            while (next < lines.length && blank(lines[next])) next += 1;
            if (next < lines.length && indentOf(lines[next]) > 0) {
              while (k < next) sub.push(lines[k++]);
              continue;
            }
            break;
          }
          if (indentOf(lines[k]) === 0) break;
          sub.push(lines[k]);
          k += 1;
        }
        list.items.push({
          inline: inline(m[3], itemAt),
          blocks: sub.length ? parseBlocks(dedent(sub), at + itemAt + 1, { quote }) : [],
        });
        // dopo righe vuote l'elenco continua solo con una voce dello stesso tipo
        let next = k;
        while (next < lines.length && blank(lines[next])) next += 1;
        const again = next < lines.length && lines[next].match(ITEM);
        if (again && again[1].length === 0 && (again[2] !== '-') === ordered) k = next;
        else break;
      }
      return [list, k];
    }

    while (i < lines.length) {
      const line = lines[i];
      const heading = top ? line.match(HEADING) : null;
      if (blank(line)) {
        i += 1;
      } else if (line.startsWith(FENCE)) {
        const from = i;
        const body = [];
        i += 1;
        while (i < lines.length && lines[i].trimEnd() !== FENCE) body.push(lines[i++]);
        if (i === lines.length) fail('codice senza chiusura', from);
        i += 1;
        blocks.push({ type: 'code', lang: line.slice(FENCE.length).trim(), text: body.join('\n') });
      } else if (isQuote(line)) {
        const from = i;
        const body = [];
        while (i < lines.length && isQuote(lines[i])) body.push(lines[i++].replace(/^> ?/, ''));
        blocks.push({ type: 'quote', blocks: parseBlocks(body, at + from, { quote: true }) });
      } else if (heading) {
        const level = heading[1].length - 2;
        if (level === 0) {
          major += 1;
          minor = 0;
        } else {
          if (major === 0) fail('una slide prima di ogni argomento', i);
          minor += 1;
        }
        const id = level === 0 ? `ssa-${major}` : `ssa-${major}-${minor}`;
        const number = level === 0 ? `${major}.` : '';
        const text = inline(heading[2], i);
        blocks.push({ type: 'heading', level, id, number, inline: text });
        sections.push({ id, level, number, inline: text });
        i += 1;
      } else if (line.startsWith('#')) {
        fail('un titolo fuori posto (solo "## " e "### ", e non dentro una citazione o un elenco)', i);
      } else if (isRow(line)) {
        const from = i;
        const rows = [];
        while (i < lines.length && isRow(lines[i])) rows.push(lines[i++]);
        if (rows.length < 3 || !ALIGN_ROW.test(rows[1].trim())) fail('tabella senza la riga di trattini sotto l\'intestazione', from);
        const head = splitRow(rows[0]);
        const aligns = splitRow(rows[1]).map(align);
        if (aligns.length !== head.length) fail('la riga di trattini non ha le colonne dell\'intestazione', from + 1);
        const body = rows.slice(2).map(splitRow);
        body.forEach((row, r) => {
          if (row.length !== head.length) fail(`una riga con ${row.length} celle invece di ${head.length}`, from + 2 + r);
        });
        blocks.push({
          type: 'table',
          align: aligns,
          head: head.map((cell) => inline(cell, from)),
          rows: body.map((row, r) => row.map((cell) => inline(cell, from + 2 + r))),
        });
      } else if (isFigureLine(line)) {
        const items = [...line.matchAll(FIGURE)].map((m) => ({
          alt: m[1],
          file: m[2],
          width: Number(m[3]),
          w: Number(m[4]),
          h: Number(m[5]),
        }));
        if (!items.length || line.replace(FIGURE, '').trim() !== '') fail('una riga di figure scritta male', i);
        blocks.push({ type: 'figures', items });
        i += 1;
      } else if (ITEM.test(line)) {
        if (indentOf(line) !== 0) fail('un elenco comincia rientrato', i);
        const [list, next] = parseList(i);
        blocks.push(list);
        i = next;
      } else {
        const from = i;
        const rows = [];
        while (i < lines.length && !blank(lines[i]) && !(i > from && isSpecial(lines[i]))) rows.push(lines[i++].trim());
        blocks.push({ type: 'p', inline: paragraph(rows, from) });
      }
    }
    return blocks;
  }

  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const blocks = parseBlocks(lines, 0, { top: true });
  return { blocks, sections };
}
