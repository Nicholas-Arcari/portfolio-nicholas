// src/pages/statistics/Homework4.jsx
// Homework #4 di Statistics: un solo indirizzo per due parti, Part 1 e
// Part 2, come le due parti dell'Homework #1 ma in una sola pagina. La
// consegna non c'e' ancora: la pagina ha la cornice degli homework, l'indice
// delle due parti e, in ciascuna, "Work in progress...". Quando arrivera' il
// testo, le due parti seguiranno il template degli altri homework: i calcoli
// in hw4/homework4.js, i testi in hw4/texts.js, la logica di presentazione
// in hw4/view.js, il worker, il programma scaricabile e la pagina di teoria.
import React, { useMemo } from 'react';
import { useLanguage } from '../../contexts/languageContext';
import HomeworkShell from './HomeworkShell';
import * as view from './hw4/view';
import { HW4_TEXTS } from './hw4/texts';

const Homework4 = () => {
  const { language } = useLanguage();
  const text = HW4_TEXTS[language] || HW4_TEXTS.en;

  const toc = useMemo(
    () => ({
      sections: view.tocEntries(text.sections),
      labels: { button: text.ui.index, title: text.ui.indexTitle, close: text.ui.close },
    }),
    [text],
  );

  return (
    <HomeworkShell slug="homework-4" toc={toc}>
      {view.SECTIONS.map((section) => (
        <section key={section.id} className="hw1-section">
          <h3 id={section.id} tabIndex={-1} className="hw1-anchor">{text.sections[section.key]}</h3>
          <div className="soft-panel" style={{ textAlign: 'center', padding: '2em 1em', marginTop: '1em' }}>
            <i className="icon solid fa-hourglass-half" style={{ fontSize: '2.5em', color: '#d52349', marginBottom: '0.5em', display: 'block' }}></i>
            <p style={{ margin: 0, fontSize: '1.2em', fontWeight: 600, textAlign: 'center' }}>{text.wip}</p>
          </div>
        </section>
      ))}
    </HomeworkShell>
  );
};

export default Homework4;
