// src/pages/reti/Markdown.jsx
// Il README del laboratorio impaginato: titoli, paragrafi (con gli a capo
// dei due spazi finali), grassetto, codice, link, elenchi, tabelle e blocchi
// di codice, cioe' quello che il README usa. Il testo non cambia: si cambia
// solo il modo di mostrarlo. I link ai file del laboratorio portano alla
// pagina di quell'esercitazione.
import React from 'react';
import { Link } from 'react-router-dom';
import { labByFile } from './labText';

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

function Inline({ text }) {
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) return <code key={i}>{part.slice(1, -1)}</code>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const ex = labByFile(link[2]);
      if (ex) return <Link key={i} to={`/reti-di-calcolatori/${ex.slug}`}>{link[1]}</Link>;
      return <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer">{link[1]}</a>;
    }
    return part;
  });
}

const isList = (line) => /^\s*[-*]\s+/.test(line);
const isRule = (line) => /^\s*-{3,}\s*$/.test(line);
const isSpecial = (line) => /^(#{1,6}\s|```|\|)/.test(line) || isList(line) || isRule(line);

function parse(md) {
  const lines = md.split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('```')) {
      const body = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith('```')) body.push(lines[i++]);
      i += 1;
      blocks.push({ type: 'code', text: body.join('\n') });
    } else if (/^#{1,6}\s/.test(line)) {
      const m = line.match(/^(#{1,6})\s+(.*)$/);
      blocks.push({ type: 'heading', level: m[1].length, text: m[2] });
      i += 1;
    } else if (isRule(line)) {
      blocks.push({ type: 'rule' });
      i += 1;
    } else if (line.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
      const cells = (row) => row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
      // la seconda riga e' quella dei trattini sotto l'intestazione
      blocks.push({ type: 'table', head: cells(rows[0]), rows: rows.slice(2).map(cells) });
    } else if (isList(line)) {
      const items = [];
      while (i < lines.length && isList(lines[i])) items.push(lines[i++].replace(/^\s*[-*]\s+/, ''));
      blocks.push({ type: 'list', items });
    } else if (line.trim() === '') {
      i += 1;
    } else {
      const para = [];
      while (i < lines.length && lines[i].trim() !== '' && !isSpecial(lines[i])) para.push(lines[i++]);
      blocks.push({ type: 'p', lines: para });
    }
  }
  return blocks;
}

// I titoli del README stanno dentro la pagina, sotto il suo titolo h2
const HEADINGS = { 1: 'h3', 2: 'h4' };

const Markdown = ({ source }) =>
  parse(source).map((block, i) => {
    switch (block.type) {
      case 'code':
        return <pre key={i} className="lab-text">{block.text}</pre>;
      case 'heading': {
        const Tag = HEADINGS[block.level] || 'h5';
        return <Tag key={i}><Inline text={block.text} /></Tag>;
      }
      case 'rule':
        return <hr key={i} />;
      case 'table':
        return (
          <div key={i} className="hw1-scroll">
            <table className="hw1-table lab-readme-table">
              <thead><tr>{block.head.map((c, j) => <th key={j}><Inline text={c} /></th>)}</tr></thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r}>{row.map((c, j) => <td key={j} data-label={block.head[j]}><Inline text={c} /></td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'list':
        return <ul key={i} className="lab-readme-list">{block.items.map((item, j) => <li key={j}><Inline text={item} /></li>)}</ul>;
      default:
        // due spazi in fondo alla riga: a capo; altrimenti la riga continua
        return (
          <p key={i}>
            {block.lines.map((l, j) => (
              <React.Fragment key={j}>
                <Inline text={l.replace(/\s+$/, '')} />
                {j < block.lines.length - 1 && (/ {2}$/.test(l) ? <br /> : ' ')}
              </React.Fragment>
            ))}
          </p>
        );
    }
  });

export default Markdown;
