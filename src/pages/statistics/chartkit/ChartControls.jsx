// src/pages/statistics/chartkit/ChartControls.jsx
// I comandi di una sezione (kitSpec): cursori, scelte, interruttori e
// azioni, con le classi delle pagine. onChange(params) riceve i parametri
// dopo ogni uso; `pending` dice che una simulazione e' in corso.
import React, { useId } from 'react';
import { useLanguage } from '../../../contexts/languageContext';
import { kitLabels } from './kitLabels';
import { applyControl, sliderIndex } from './kitSpec';

export const ChartControls = ({ controls, params, onChange, pending = false }) => {
  const id = useId();
  const { language } = useLanguage();
  const actions = controls.filter((c) => c.kind === 'action');
  return (
    <div className="kit-controls">
      {controls.map((c, i) => {
        if (c.kind === 'slider') {
          const index = sliderIndex(c, params);
          const label = c.label(c.values[index]);
          return (
            <div key={c.key} className="hw3-slider">
              <label htmlFor={`${id}-${c.key}`}>{label}</label>
              <input id={`${id}-${c.key}`} type="range" min={0} max={c.values.length - 1} step={1} value={index} aria-valuetext={label} onChange={(e) => onChange(applyControl(c, params, Number(e.target.value)))} />
            </div>
          );
        }
        if (c.kind === 'choice') {
          return (
            <div key={c.key} className="hw3-choices" role="group" aria-label={c.label}>
              <span className="hw3-choices-label">{c.label}</span>
              {c.options.map(([value, name]) => (
                <button key={String(value)} type="button" className="button alt" aria-pressed={params[c.key] === value} onClick={() => onChange(applyControl(c, params, value))}>{name}</button>
              ))}
            </div>
          );
        }
        if (c.kind === 'toggle') {
          return (
            <label key={c.key} className="kit-toggle">
              <input type="checkbox" checked={!!params[c.key]} onChange={(e) => onChange(applyControl(c, params, e.target.checked))} />
              {` ${c.label}`}
            </label>
          );
        }
        return i === controls.indexOf(actions[0]) ? (
          <p key="actions" className="kit-actions">
            {actions.map((a) => <button key={a.label} type="button" className="button alt small" onClick={() => onChange(applyControl(a, params))}>{a.label}</button>)}
          </p>
        ) : null;
      })}
      {pending && <p className="kit-pending hw1-note" role="status">{kitLabels(language).pending}</p>}
    </div>
  );
};

export default ChartControls;
