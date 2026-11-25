// src/pages/ssa/SsaLecture.jsx
// Una lezione di Security in Software Applications, impaginata come quelle di
// Distributed Systems: l'indice degli argomenti e delle slide, e nella
// colonna destra la lezione precedente e quella successiva. Il testo c'e' in
// inglese e in italiano e segue la lingua del sito; al cambio di lingua la
// pagina resta sullo stesso paragrafo, perche' i due testi hanno gli stessi
// blocchi nello stesso ordine. Un clic su una figura la apre grande, sopra
// la pagina.
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/languageContext';
import { SSA_LECTURES } from '../../config/ssa';
import StatisticsLayout from '../statistics/StatisticsLayout';
import HomeworkIndex from '../statistics/HomeworkIndex';
import NotFound from '../NotFound';
import SsaDoc, { Inline } from './SsaDoc';
import { loadNotes } from './notesText';
import { SSA_PATH, ssaCourse, lectureCount, lectureName, lectureNumber, neighbours } from './ssaCourse';
import './ssa.css';
import '../../i18n/ssa';

const FIGURES = `${import.meta.env.BASE_URL}images/ssa/`;
const OPEN_CLASS = 'hw-index-open';

// Il primo blocco ancora in vista e la sua distanza dall'alto della finestra
function blockInView(root) {
  if (!root) return null;
  for (const el of root.querySelectorAll('[data-b]')) {
    const box = el.getBoundingClientRect();
    if (box.bottom > 0) return { index: el.dataset.b, top: box.top };
  }
  return null;
}

// La figura aperta grande: un <dialog> nativo, come l'indice. Esc, il
// pulsante o un clic fuori dall'immagine la chiudono
function FigureViewer({ figure, onClose, labels }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;
    if (figure && !dialog.open) {
      document.documentElement.classList.add(OPEN_CLASS);
      dialog.showModal();
    } else if (!figure && dialog.open) {
      dialog.close();
    }
    return undefined;
  }, [figure]);
  useEffect(() => () => document.documentElement.classList.remove(OPEN_CLASS), []);
  const close = () => {
    document.documentElement.classList.remove(OPEN_CLASS);
    onClose();
  };
  return (
    <dialog
      ref={ref}
      className="ssa-viewer"
      aria-label={figure ? figure.alt : undefined}
      onClose={close}
      onClick={(e) => {
        if (e.target === e.currentTarget || e.target.classList.contains('ssa-viewer-box')) close();
      }}
    >
      {figure && (
        <div className="ssa-viewer-box">
          <img src={FIGURES + figure.file} alt={figure.alt} width={figure.w} height={figure.h} />
          <div className="ssa-viewer-bar">
            <span>{figure.alt}</span>
            <button type="button" className="ssa-viewer-close" onClick={close} aria-label={labels.close}>&times;</button>
          </div>
        </div>
      )}
    </dialog>
  );
}

function LecturePage({ lecture }) {
  const { t, language } = useLanguage();
  // il testo mostrato: quello dell'ultima lingua arrivata, finche' non
  // arriva quello della lingua appena scelta
  const [doc, setDoc] = useState(null);
  const [failed, setFailed] = useState(false);
  const [figure, setFigure] = useState(null);
  const articleRef = useRef(null);
  const titleRef = useRef(null);
  const anchor = useRef(null);

  useEffect(() => {
    let alive = true;
    loadNotes(lecture.file, language).then(
      (parsed) => {
        if (!alive) return;
        anchor.current = blockInView(articleRef.current);
        setFailed(false);
        setDoc(parsed);
      },
      () => {
        if (alive) setFailed(true);
      },
    );
    return () => {
      alive = false;
    };
  }, [lecture.file, language]);

  // Il nuovo testo e' in pagina: lo stesso blocco di prima torna dov'era
  useLayoutEffect(() => {
    const saved = anchor.current;
    anchor.current = null;
    if (!saved || !articleRef.current) return;
    const el = articleRef.current.querySelector(`[data-b="${saved.index}"]`);
    if (el) window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - saved.top, behavior: 'instant' });
  }, [doc]);

  const toc = useMemo(
    () => doc && {
      sections: doc.sections.map(({ id, level, number, inline }) => ({ id, level, title: <>{number && `${number} `}<Inline nodes={inline} /></> })),
      labels: { button: t('ssa.index'), title: t('ssa.indexTitle'), close: t('ssa.close') },
    },
    [doc, t],
  );

  const labels = { figureOpen: t('ssa.figureOpen'), quote: t('ssa.quoteLabel'), close: t('ssa.close') };

  const backToTop = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    if (titleRef.current) titleRef.current.focus({ preventScroll: true });
  };

  const { prev, next } = neighbours(lecture);
  const to = (other) => `${SSA_PATH}/${other.slug}`;

  const navBox = (
    <section>
      <ul className="divided">
        <li>
          <article className="box highlight ssa-nav-box">
            <header><h3>{t('ssa.navTitle')}</h3></header>
            <p>{`${lectureNumber(lecture, t)} ${t('ssa.of')} ${lectureCount()}`}</p>
            {prev && <Link to={to(prev)} className="button alt icon solid fa-arrow-left" title={lectureName(prev, language, t)}>{lectureNumber(prev, t)}</Link>}
            {next && <Link to={to(next)} className="button alt icon solid fa-arrow-right" title={lectureName(next, language, t)}>{lectureNumber(next, t)}</Link>}
            <Link to={SSA_PATH} className="button alt icon solid fa-list-ul">{t('ssa.backToList')}</Link>
          </article>
        </li>
      </ul>
    </section>
  );

  return (
    <StatisticsLayout terminal={[`> cat ${lecture.file}.md`, ...t('ssa.lectureTerminal')]} course={ssaCourse(t)} index={toc} sidebar={navBox}>
      <article className="box post th-page ssa-doc" ref={articleRef}>
        <header className="hw-title">
          <h2 ref={titleRef} tabIndex={-1}>{lectureName(lecture, language, t)}</h2>
          {toc && <HomeworkIndex sections={toc.sections} labels={toc.labels} />}
        </header>

        {doc && <SsaDoc blocks={doc.blocks} onFigure={setFigure} labels={labels} />}
        {!doc && !failed && <p className="hw1-note hw1-pending" role="status">{t('ssa.loading')}</p>}
        {failed && <p className="hw1-note" role="alert">{t('ssa.loadError')}</p>}

        <div className="hw-bottom-actions">
          <Link to={SSA_PATH} className="button alt icon solid fa-arrow-left">{t('ssa.backToList')}</Link>
          {prev && <Link to={to(prev)} className="button alt icon solid fa-angle-left">{lectureNumber(prev, t)}</Link>}
          {next && <Link to={to(next)} className="button alt icon solid fa-angle-right">{lectureNumber(next, t)}</Link>}
          <button type="button" className="button alt icon solid fa-arrow-up" onClick={backToTop}>{t('ssa.backToTop')}</button>
        </div>
      </article>
      <FigureViewer figure={figure} onClose={() => setFigure(null)} labels={labels} />
    </StatisticsLayout>
  );
}

const SsaLecture = () => {
  const { slug } = useParams();
  const lecture = SSA_LECTURES.find((l) => l.slug === slug);
  if (!lecture) return <NotFound />;
  // la chiave riparte da capo a ogni lezione: testo, indice e scorrimento
  return <LecturePage key={slug} lecture={lecture} />;
};

export default SsaLecture;
