// src/pages/distributed/Tex.jsx
// Una formula impaginata da KaTeX, nel testo o a se' (display). KaTeX
// costruisce i nodi uno per uno e ne imposta lo stile dal codice, non con
// attributi style: e' l'unico modo che la Content Security Policy del sito
// lascia passare (renderToString scriverebbe proprio quegli attributi).
// Una formula sbagliata non arriva fin qui: la ferma la build.
import React, { memo, useLayoutEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const Tex = memo(function Tex({ tex, display = false }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    katex.render(tex, ref.current, { displayMode: display, throwOnError: false });
  }, [tex, display]);
  // uno span anche per la formula a se': puo' stare in mezzo a un paragrafo
  return <span ref={ref} className={display ? 'ds-math ds-math-display' : 'ds-math'} tabIndex={display ? 0 : undefined} />;
});

export default Tex;
