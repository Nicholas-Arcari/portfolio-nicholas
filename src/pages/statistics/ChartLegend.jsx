// src/pages/statistics/ChartLegend.jsx
// La legenda dei grafici degli homework, comune a tutte le pagine: ogni voce
// e' un pulsante che nasconde o mostra la sua parte del grafico (una curva,
// le barre, una linea di riferimento) e, dove la pagina la collega, la sua
// colonna o riga della tabella annessa. All'apertura si vede tutto.
//
// Una voce e' { label, color | paletteKey, dashed?, box?, parts }: `parts`
// sono le parti del disegno che nasconde, con i nomi che le funzioni di
// disegno di ogni homework riconoscono nel campo `hidden` dei dati
// ('series:2', 'bars', 'curve', ...). Gli assi non cambiano: una parte
// nascosta conta ancora per la scala, semplicemente non si disegna. Lo
// stato (useHidden, hiddenParts) e' in legendState.js.
import React from 'react';

/** The color of an item: a series of the palette, or a named color (bars, reference lines). */
const colorOf = (item, i, palette) => (item.paletteKey ? palette[item.paletteKey] : palette.series[(item.color ?? i) % palette.series.length]);

/**
 * The legend under a chart, or under a group of charts that share it. A
 * pressed button is a part on screen; pressing it hides the part, pressing
 * it again shows it.
 */
export const ChartLegend = ({ items, palette, hidden, onToggle, label = null }) => (
  <ul className="hw2a-legend hw-legend" aria-label={label || undefined}>
    {items.map((item, i) => {
      const off = hidden.has(i);
      const color = colorOf(item, i, palette);
      let swatch = '';
      if (item.box) swatch = 'is-box';
      else if (item.dashed) swatch = 'is-dashed';
      return (
        <li key={`${i}|${item.label}`}>
          <button type="button" className={off ? 'is-off' : ''} aria-pressed={!off} onClick={() => onToggle(i)}>
            <span className={swatch} style={{ borderColor: color, backgroundColor: item.box ? color : 'transparent' }} aria-hidden="true" />
            {item.label}
          </button>
        </li>
      );
    })}
  </ul>
);
