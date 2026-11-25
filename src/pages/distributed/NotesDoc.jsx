// src/pages/distributed/NotesDoc.jsx
// Una lezione impaginata dai blocchi di parseNotes.js: titoli numerati,
// paragrafi, elenchi, formule, pseudo-codici e tabelle, con gli stili delle
// pagine di teoria di Statistics. Ogni blocco porta la sua posizione
// (data-b): al cambio di lingua la pagina resta sullo stesso blocco.
import React from 'react';
import Tex from './Tex';

/** Il testo di un blocco: grassetto, corsivo, codice e formule. */
export function Inline({ nodes }) {
  return nodes.map((node, i) => {
    switch (node.t) {
      case 'strong':
        return <strong key={i}><Inline nodes={node.c} /></strong>;
      case 'em':
        return <em key={i}><Inline nodes={node.c} /></em>;
      case 'code':
        return <code key={i}>{node.v}</code>;
      case 'math':
        return <Tex key={i} tex={node.v} />;
      case 'dmath':
        return <Tex key={i} tex={node.v} display />;
      default:
        return node.v;
    }
  });
}

function List({ list, index }) {
  const Tag = list.ordered ? 'ol' : 'ul';
  return (
    <Tag className="th-list ds-list" start={list.ordered && list.start !== 1 ? list.start : undefined} data-b={index}>
      {list.items.map((item, i) => (
        <li key={i}>
          <Inline nodes={item.inline} />
          {item.lists.map((nested, j) => <List key={j} list={nested} />)}
        </li>
      ))}
    </Tag>
  );
}

function Block({ block, index }) {
  switch (block.type) {
    case 'heading': {
      const Tag = block.level === 0 ? 'h3' : 'h4';
      return (
        <Tag id={block.id} tabIndex={-1} data-b={index} className={`hw1-anchor ds-heading ds-heading-${block.level}`}>
          {block.number} <Inline nodes={block.inline} />
        </Tag>
      );
    }
    case 'list':
      return <List list={block} index={index} />;
    case 'math':
      return <p className="ds-formula" data-b={index}><Tex tex={block.tex} display /></p>;
    case 'code':
      return (
        <figure className="lab-code ds-code" data-b={index}>
          {block.label && <figcaption>{block.label}</figcaption>}
          <pre tabIndex={0}>{block.text}</pre>
        </figure>
      );
    case 'table':
      return (
        <div className="ds-table-scroll" data-b={index}>
          <table className="hw1-table th-table ds-table">
            <thead><tr>{block.head.map((cell, j) => <th key={j}><Inline nodes={cell} /></th>)}</tr></thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>{row.map((cell, j) => <td key={j}><Inline nodes={cell} /></td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return <p data-b={index}><Inline nodes={block.inline} /></p>;
  }
}

const NotesDoc = ({ blocks }) => blocks.map((block, i) => <Block key={i} block={block} index={i} />);

export default NotesDoc;
