// src/pages/reti/LabDoc.jsx
// Il testo di un'esercitazione impaginato. Il file .lab in ./doc contiene le
// stesse righe del .txt del laboratorio, divise in blocchi:
//
//   @banner ... @end          il disegno ASCII in testa al file
//   @author testo             la riga con nome e matricola
//   @sep - - - -              una riga di separazione
//   @sub testo                un sottotitolo dentro un'analisi
//   ## Titolo / ### Titolo    i titoli, che finiscono nell'indice
//   @goal ... @end            l'obiettivo dell'esercitazione
//   @analysis [titolo] ... @end   un'analisi a basso livello (puo' contenere
//                             gli altri blocchi)
//   @term ... @end            un terminale: ogni riga comincia con "$ "
//                             (comando), "| " (output) o "# " (commento)
//   @code [etichetta] ... @end    un file, uno schema o una formula
//   @cmds ... @end            comandi con la loro spiegazione dopo "--->>"
//
// Fuori dai blocchi ci sono paragrafi ed elenchi; una riga che comincia con
// "#" e' il racconto di chi ha svolto l'esercitazione e perde il "#".
import React from 'react';
import { accents } from './accents';

const INLINE = /(`[^`]+`|https?:\/\/[^\s<>"'`]*[^\s<>"'`.,;:)])/g;

// Un testo di prosa: accenti veri, codice fra apici inversi, link cliccabili
function Prose({ text }) {
  return text.split(INLINE).map((part, i) => {
    if (i % 2 === 0) return accents(part);
    if (part.startsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>;
    return <a key={i} href={part} target="_blank" rel="noopener noreferrer">{part}</a>;
  });
}

function List({ items }) {
  const ordered = /^[\da-z]/.test(items[0].marker);
  const Tag = ordered ? 'ol' : 'ul';
  const letters = /^[a-z]\)$/.test(items[0].marker);
  return (
    <Tag className="lab-list" type={letters ? 'a' : undefined}>
      {items.map((item, i) => {
        const value = !ordered ? undefined : letters ? item.marker.charCodeAt(0) - 96 : parseInt(item.marker, 10);
        return (
          <li key={i} value={value}>
            <Prose text={item.text} />
            {item.items.length > 0 && <List items={item.items} />}
            {item.after && <Prose text={item.after} />}
          </li>
        );
      })}
    </Tag>
  );
}

// Il prompt all'inizio di un comando ("> ", "ng1> ", "root@ns2:/# ") e la
// nota in fondo ("<<---- ...", "# ..."), staccata da tabulazioni o spazi:
// note e commenti sono racconto, e prendono gli accenti come la prosa
const PROMPT = /^(?:(?:> ?)?(?:root@[\w.-]+:[^\s#$]*[#$] ?|[a-z_][\w.-]*@[\w.-]+:[^\s$#]*[$#] ?)|> (?=\S)|>(?=[a-z])|[A-Za-z0-9_.-]+> |root@[\w.-]+: |\$ )/;
const NOTE = /(?:\t+|\s{2,})(?:<<-+|-{2,}>>|#\s).*$/;

function Command({ text }) {
  const prompt = (text.match(PROMPT) || [''])[0];
  let cmd = text.slice(prompt.length);
  const note = cmd.match(NOTE);
  if (note) cmd = cmd.slice(0, note.index);
  return (
    <>
      {prompt && <span className="lab-prompt">{prompt}</span>}
      <span className="lab-cmd">{cmd}</span>
      {note && <span className="lab-note">{accents(note[0])}</span>}
    </>
  );
}

function Block({ block, labels }) {
  switch (block.type) {
    case 'banner':
      return <pre className="lab-banner" aria-hidden="true">{block.text}</pre>;
    case 'author':
      return <p className="lab-author">{block.text}</p>;
    case 'sep':
      return <hr className="lab-sep" />;
    case 'heading': {
      const Tag = block.level === 0 ? 'h3' : 'h4';
      return <Tag id={block.id} tabIndex={-1} className="hw1-anchor lab-heading"><Prose text={block.text} /></Tag>;
    }
    case 'goal':
      return (
        <div className="lab-goal">
          {block.blocks.map((b, i) => <Block key={i} block={b} labels={labels} />)}
        </div>
      );
    case 'analysis':
      return (
        <aside className="lab-analysis">
          <p className="lab-analysis-label">{`Analisi a basso livello${block.title ? ` - ${block.title}` : ''}`}</p>
          {block.blocks.map((b, i) => <Block key={i} block={b} labels={labels} />)}
        </aside>
      );
    case 'term':
      return (
        <pre className="lab-term">
          {block.rows.map((row, i) => (
            <React.Fragment key={i}>
              {row.kind === 'cmd' && <Command text={row.text} />}
              {row.kind === 'out' && row.text}
              {row.kind === 'comment' && <span className="lab-comment">{accents(row.text)}</span>}
              {i < block.rows.length - 1 && '\n'}
            </React.Fragment>
          ))}
        </pre>
      );
    case 'code':
      return (
        <figure className="lab-code">
          {block.label && <figcaption>{block.label}</figcaption>}
          <pre>{block.text}</pre>
        </figure>
      );
    case 'cmds':
      return (
        <table className="lab-cmds">
          <thead><tr><th>{labels.command}</th><th>{labels.what}</th></tr></thead>
          <tbody>
            {block.rows.map((row, i) => (
              <tr key={i}>
                <td><code>{row.cmd}</code></td>
                <td><Prose text={row.text} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    case 'list':
      return <List items={block.items} />;
    default: {
      // "@sub Titolo" o "=== Titolo ===" dentro un'analisi: un sottotitolo
      const sub = block.sub ? block.text : (block.text.match(/^=+\s*(.+?)\s*=+$/) || [])[1];
      if (sub) return <p className="lab-subhead"><Prose text={sub} /></p>;
      return <p><Prose text={block.text} /></p>;
    }
  }
}

const LabDoc = ({ blocks, labels }) => blocks.map((block, i) => <Block key={i} block={block} labels={labels} />);

export default LabDoc;
