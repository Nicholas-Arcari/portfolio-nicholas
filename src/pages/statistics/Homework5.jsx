// src/pages/statistics/Homework5.jsx
// Homework #5 di Statistics. La consegna non c'e' ancora: la pagina ha la
// cornice degli homework e "Work in progress...". Quando arrivera' il testo,
// seguira' il template degli altri homework: i calcoli in hw5/homework5.js,
// i testi in hw5/texts.js, la logica di presentazione in hw5/view.js, il
// worker, il programma scaricabile e la pagina di teoria.
import React from 'react';
import { useLanguage } from '../../contexts/languageContext';
import HomeworkShell from './HomeworkShell';
import { HW5_TEXTS } from './hw5/texts';

const Homework5 = () => {
  const { language } = useLanguage();
  const text = HW5_TEXTS[language] || HW5_TEXTS.en;

  return (
    <HomeworkShell slug="homework-5">
      <div className="soft-panel" style={{ textAlign: 'center', padding: '2em 1em', marginTop: '1.5em' }}>
        <i className="icon solid fa-hourglass-half" style={{ fontSize: '2.5em', color: '#d52349', marginBottom: '0.5em', display: 'block' }}></i>
        <p style={{ margin: 0, fontSize: '1.2em', fontWeight: 600, textAlign: 'center' }}>{text.wip}</p>
      </div>
    </HomeworkShell>
  );
};

export default Homework5;
