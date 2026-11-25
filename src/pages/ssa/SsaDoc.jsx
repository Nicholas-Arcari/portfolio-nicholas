// src/pages/ssa/SsaDoc.jsx
// Una lezione impaginata dai blocchi di parseNotes.js: argomenti numerati e
// slide, paragrafi, elenchi, codice, tabelle, figure e, nel riquadro con il
// filo a sinistra, il testo della slide parola per parola. Il testo della
// slide e il codice restano in inglese anche nella pagina italiana, e lo
// dichiarano (lang="en"). Ogni blocco porta la sua posizione (data-b): al
// cambio di lingua la pagina resta sullo stesso blocco.
import React from 'react';

const LANGUAGES = { c: 'C', java: 'Java', solidity: 'Solidity', php: 'PHP', sql: 'SQL', sh: 'Shell' };
const FIGURES = `${import.meta.env.BASE_URL}images/ssa/`;

/** Il testo di un blocco: grassetto, corsivo, codice, esponenti e a capo. */
export function Inline({ nodes }) {
  return nodes.map((node, i) => {
    switch (node.t) {
      case 'strong':
        return <strong key={i}><Inline nodes={node.c} /></strong>;
      case 'em':
        return <em key={i}><Inline nodes={node.c} /></em>;
      case 'sup':
        return <sup key={i}><Inline nodes={node.c} /></sup>;
      case 'code':
        return <code key={i}>{node.v}</code>;
      case 'br':
        return <br key={i} />;
      default:
        return node.v;
    }
  });
}

// Una figura e' larga quanto nella bobina, dove la colonna era quella di un
// A4; qui la colonna e' piu' stretta, quindi un po' di piu'. Un clic la apre
// grande (SsaLecture.jsx)
const FIGURE_SCALE = 1.6;

function Figures({ items, onOpen, labels }) {
  return (
    <div className="ssa-figures">
      {items.map((figure) => (
        <button
          key={figure.file}
          type="button"
          className="ssa-figure"
          style={{ width: `${Math.min(100, figure.width * FIGURE_SCALE)}%` }}
          onClick={() => onOpen(figure)}
          aria-label={`${figure.alt}: ${labels.figureOpen}`}
        >
          <img src={FIGURES + figure.file} alt={figure.alt} width={figure.w} height={figure.h} loading="lazy" decoding="async" />
        </button>
      ))}
    </div>
  );
}

function List({ list, ctx }) {
  const Tag = list.ordered ? 'ol' : 'ul';
  return (
    <Tag className="th-list ssa-list" start={list.ordered && list.start !== 1 ? list.start : undefined}>
      {list.items.map((item, i) => (
        <li key={i}>
          <Inline nodes={item.inline} />
          {item.blocks.map((block, j) => <Block key={j} block={block} ctx={ctx} />)}
        </li>
      ))}
    </Tag>
  );
}

function Block({ block, index, ctx }) {
  switch (block.type) {
    case 'heading': {
      const Tag = block.level === 0 ? 'h3' : 'h4';
      return (
        <Tag id={block.id} tabIndex={-1} data-b={index} className={`hw1-anchor ssa-heading ssa-heading-${block.level}`}>
          {block.number && `${block.number} `}<Inline nodes={block.inline} />
        </Tag>
      );
    }
    case 'list':
      return <div data-b={index}><List list={block} ctx={ctx} /></div>;
    case 'code': {
      const label = LANGUAGES[block.lang];
      return (
        <figure className="lab-code ssa-code" data-b={index} lang="en">
          {label && <figcaption>{label}</figcaption>}
          <pre>{block.text}</pre>
        </figure>
      );
    }
    case 'table':
      return (
        <div className="ssa-table-scroll" data-b={index}>
          <table className="hw1-table th-table ssa-table">
            <thead>
              <tr>{block.head.map((cell, j) => <th key={j} className={block.align[j] ? `ssa-${block.align[j]}` : undefined}><Inline nodes={cell} /></th>)}</tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>{row.map((cell, j) => <td key={j} className={block.align[j] ? `ssa-${block.align[j]}` : undefined}><Inline nodes={cell} /></td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'quote':
      return (
        <blockquote className="ssa-quote" data-b={index} lang="en" aria-label={ctx.labels.quote}>
          {block.blocks.map((inner, j) => <Block key={j} block={inner} ctx={ctx} />)}
        </blockquote>
      );
    case 'figures':
      return <div data-b={index}><Figures items={block.items} onOpen={ctx.onFigure} labels={ctx.labels} /></div>;
    default:
      return <p data-b={index}><Inline nodes={block.inline} /></p>;
  }
}

/**
 * La lezione intera. `onFigure` riceve la figura cliccata; `labels` le
 * etichette per chi usa un lettore di schermo (figura da aprire, testo
 * della slide).
 */
const SsaDoc = ({ blocks, onFigure, labels }) => {
  const ctx = { onFigure, labels };
  return blocks.map((block, i) => <Block key={i} block={block} index={i} ctx={ctx} />);
};

export default SsaDoc;
