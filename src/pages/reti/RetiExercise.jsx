// src/pages/reti/RetiExercise.jsx
// Una esercitazione del laboratorio di Reti di Calcolatori: il testo del
// file impaginato come gli homework di Statistics (paragrafi, terminali con
// comandi e output, file e schemi, analisi a basso livello), con l'indice
// dei suoi titoli, e nella sidebar il file originale da scaricare e il link
// a GitHub. Il testo resta in italiano anche con il sito in inglese.
import React, { Suspense, use, useMemo, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/languageContext';
import { RETI_LAB, RETI_REPO } from '../../config/reti';
import StatisticsLayout from '../statistics/StatisticsLayout';
import HomeworkIndex from '../statistics/HomeworkIndex';
import NotFound from '../NotFound';
import LabDoc from './LabDoc';
import { parseLab } from './parseLab';
import { labDescription, loadLabDoc, loadLabText } from './labText';
import { retiCourse } from './retiCourse';

// Il file scaricato e' quello originale, cosi' com'e', in UTF-8
async function downloadText(file) {
  const text = await loadLabText(file);
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = file;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function ExercisePage({ ex }) {
  const { t, language } = useLanguage();
  const source = use(loadLabDoc(ex.file));
  const doc = useMemo(() => parseLab(source), [source]);
  const titleRef = useRef(null);

  const labels = { button: t('reti.index'), title: t('reti.indexTitle'), close: t('reti.close') };
  const docLabels = { command: t('reti.colCommand'), what: t('reti.colWhat') };

  const backToTop = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    if (titleRef.current) titleRef.current.focus({ preventScroll: true });
  };

  const fileBox = (
    <section>
      <ul className="divided">
        <li>
          <article className="box highlight lab-file-box">
            <header><h3>{t('reti.fileTitle')}</h3></header>
            <p>{t('reti.fileText')}</p>
            <p className="lab-file-name">{ex.file}</p>
            <button type="button" className="button icon solid fa-download" onClick={() => downloadText(ex.file)}>{t('reti.download')}</button>
            <a href={`${RETI_REPO}/blob/main/${ex.file}`} target="_blank" rel="noopener noreferrer" className="button alt icon brands fa-github">{t('reti.github')}</a>
          </article>
        </li>
      </ul>
    </section>
  );

  return (
    <StatisticsLayout terminal={[`> cat ${ex.file}`, ...t('reti.exerciseTerminal')]} course={retiCourse(t)} sidebar={fileBox}>
      <article className="box post lab-doc">
        <header className="hw-title">
          <h2 ref={titleRef} tabIndex={-1}>{ex.name}</h2>
          {doc.sections.length > 1 && <HomeworkIndex sections={doc.sections} labels={labels} />}
        </header>
        <p>{labDescription(ex, language)}</p>
        <p className="hw1-note">{t('reti.textNote')}</p>

        <LabDoc blocks={doc.blocks} labels={docLabels} />

        <div className="hw-bottom-actions">
          <Link to="/reti-di-calcolatori" className="button alt icon solid fa-arrow-left">{t('reti.backToList')}</Link>
          <button type="button" className="button alt icon solid fa-arrow-up" onClick={backToTop}>{t('reti.backToTop')}</button>
        </div>
      </article>
    </StatisticsLayout>
  );
}

// Mentre arriva il testo (un file per esercitazione, caricato a parte)
function Loading({ ex }) {
  const { t } = useLanguage();
  return (
    <StatisticsLayout terminal={[`> cat ${ex.file}`]} course={retiCourse(t)}>
      <article className="box post">
        <header className="hw-title"><h2>{ex.name}</h2></header>
        <p className="hw1-note hw1-pending" role="status">{t('reti.loading')}</p>
      </article>
    </StatisticsLayout>
  );
}

const RetiExercise = () => {
  const { slug } = useParams();
  const ex = RETI_LAB.find((e) => e.slug === slug);
  if (!ex) return <NotFound />;
  return (
    <Suspense key={slug} fallback={<Loading ex={ex} />}>
      <ExercisePage ex={ex} />
    </Suspense>
  );
};

export default RetiExercise;
