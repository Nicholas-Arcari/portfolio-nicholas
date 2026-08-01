// src/components/WheelOfFortune.jsx
// Ruota della fortuna randomica per le pagine cucina/cocktail.
// L'immagine della ruota e' un SVG autonomo (nessuna dipendenza/asset esterno):
// ogni spicchio mostra il simbolo dell'elemento, lo stesso riportato accanto al
// nome nella lista. Premendo il bottone la ruota gira e si ferma, in modo
// casuale, sull'elemento suggerito.
import React, { useMemo, useRef, useState } from 'react';

const COLORS = ['#e94560', '#f0a500', '#3fa796', '#5c6bc0', '#ef6c57', '#7cb342', '#26a69a', '#ab47bc'];

// angolo in gradi (0 = ore 12, senso orario) -> coordinate SVG
const polar = (cx, cy, r, angleDeg) => {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
};

const WheelOfFortune = ({ items, title, intro, spinLabel, spinningLabel, resultLabel }) => {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const pendingWinner = useRef(null);

  const n = items.length;
  const seg = n > 0 ? 360 / n : 360;
  const cx = 100;
  const cy = 100;
  const r = 92;

  const slices = useMemo(() => items.map((item, i) => {
    const a0 = i * seg;
    const a1 = (i + 1) * seg;
    const [x0, y0] = polar(cx, cy, r, a0);
    const [x1, y1] = polar(cx, cy, r, a1);
    const large = seg > 180 ? 1 : 0;
    const d = `M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
    const [tx, ty] = polar(cx, cy, r * 0.64, a0 + seg / 2);
    return { d, color: COLORS[i % COLORS.length], tx, ty, sym: item.sym };
  }), [items, seg]);

  const spin = () => {
    if (spinning || n === 0) return;
    const winner = Math.floor(Math.random() * n);
    pendingWinner.current = winner;
    const center = winner * seg + seg / 2;          // angolo del centro spicchio
    const alignment = (360 - (center % 360)) % 360;  // portalo sotto il puntatore in alto
    const currentMod = ((rotation % 360) + 360) % 360;
    const delta = 360 * 5 + ((alignment - currentMod + 360) % 360);
    setResult(null);
    setSpinning(true);
    setRotation(rotation + delta);
  };

  const onSpinEnd = () => {
    if (!spinning) return;
    setSpinning(false);
    if (pendingWinner.current != null) setResult(items[pendingWinner.current]);
  };

  return (
    <div className="wheel">
      {title && <header><h3>{title}</h3></header>}
      {intro && <p style={{ fontSize: '0.9em', color: '#666' }}>{intro}</p>}

      <div className="wheel-stage">
        <div className="wheel-pointer" aria-hidden="true"></div>
        <svg className="wheel-svg" viewBox="0 0 200 200" role="img" aria-label={title}>
          <g
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'center',
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 4.2s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
            }}
            onTransitionEnd={onSpinEnd}
          >
            {slices.map((s, i) => (
              <g key={i}>
                <path d={s.d} fill={s.color} stroke="#ffffff" strokeWidth="1" />
                <text x={s.tx} y={s.ty} textAnchor="middle" dominantBaseline="central" fontSize="13">{s.sym}</text>
              </g>
            ))}
            <circle cx={cx} cy={cy} r="14" fill="#ffffff" stroke="#dddddd" strokeWidth="2" />
          </g>
        </svg>
      </div>

      <button
        type="button"
        className="button icon solid fa-sync-alt wheel-btn"
        onClick={spin}
        disabled={spinning}
        style={{ width: '100%', marginTop: '1em' }}
      >
        {spinning ? spinningLabel : spinLabel}
      </button>

      {result && (
        <div className="wheel-result fade-in" style={{ marginTop: '1em', textAlign: 'center' }}>
          <span style={{ fontSize: '0.85em', color: '#888', display: 'block', marginBottom: '0.2em' }}>{resultLabel}</span>
          <strong style={{ fontSize: '1.1em' }}>{result.sym} {result.name}</strong>
        </div>
      )}
    </div>
  );
};

export default WheelOfFortune;
