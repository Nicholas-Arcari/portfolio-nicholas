// src/pages/reti/RetiExercise.jsx
// Una esercitazione del laboratorio di Reti di Calcolatori: il file del
// repository riportato identico, in carattere fisso perche' i disegni ASCII
// restino in piedi, con l'indice dei suoi titoli "+++ ... +++", il pulsante
// per andare a capo sulle righe lunghe, e nella sidebar il file da scaricare
// e il link a GitHub. Il testo resta in italiano anche con il sito in inglese.
import React, { Suspense, use, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/languageContext';
import { RETI_LAB, RETI_REPO } from '../../config/reti';
import StatisticsLayout from '../statistics/StatisticsLayout';
import HomeworkIndex from '../statistics/HomeworkIndex';
import NotFound from '../NotFound';
import { labDescription, labSections, loadLabText } from './labText';
import { retiCourse } from './retiCourse';

// Il file scaricato e' lo stesso testo, cosi' com'e', in UTF-8
function downloadText(text, name) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function ExercisePage({ ex }) {
  const { t, language } = useLanguage();
  const text = use(loadLabText(ex.file));
  const pieces = useMemo(() => labSections(text), [text]);
  const [wrap, setWrap] = useState(false);
  const titleRef = useRef(null);

  const sections = pieces.filter((p) => p.id).map((p) => ({ id: p.id, title: p.title, level: 0 }));
  const labels = { button: t('reti.index'), title: t('reti.indexTitle'), close: t('reti.close') };

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
            <button type="button" className="button icon solid fa-download" onClick={() => downloadText(text, ex.file)}>{t('reti.download')}</button>
            <a href={`${RETI_REPO}/blob/main/${ex.file}`} target="_blank" rel="noopener noreferrer" className="button alt icon brands fa-github">{t('reti.github')}</a>
          </article>
        </li>
      </ul>
    </section>
  );

  return (
    <StatisticsLayout terminal={[`> cat ${ex.file}`, ...t('reti.exerciseTerminal')]} course={retiCourse(t)} sidebar={fileBox}>
      <article className="box post">
        <header className="hw-title">
          <h2 ref={titleRef} tabIndex={-1}>{ex.name}</h2>
          {sections.length > 1 && <HomeworkIndex sections={sections} labels={labels} />}
        </header>
        <p>{labDescription(ex, language)}</p>

        <div className="lab-toolbar">
          <span className="lab-file-name">{ex.file}</span>
          <button type="button" className="button alt small" aria-pressed={wrap} onClick={() => setWrap((w) => !w)}>{t('reti.wrap')}</button>
        </div>
        <p className="hw1-note">{t('reti.textNote')}</p>
        <pre className={wrap ? 'lab-text is-wrapped' : 'lab-text'}>
          {pieces.map((p, i) => (p.id
            ? <span key={i} id={p.id} tabIndex={-1} className="lab-anchor">{p.text}</span>
            : <React.Fragment key={i}>{p.text}</React.Fragment>))}
        </pre>

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
