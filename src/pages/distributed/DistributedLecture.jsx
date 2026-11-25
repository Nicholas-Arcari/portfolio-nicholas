// src/pages/distributed/DistributedLecture.jsx
// Una lezione di Distributed Systems: il testo impaginato come le pagine di
// teoria di Statistics (titoli numerati, formule, pseudo-codici), con
// l'indice dei suoi titoli e, nella colonna destra, la lezione precedente e
// quella successiva. Il testo c'e' in inglese e in italiano e segue la
// lingua del sito: al cambio di lingua la pagina resta sullo stesso
// paragrafo, perche' i due testi hanno gli stessi blocchi nello stesso ordine.
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/languageContext';
import { DS_LECTURES } from '../../config/distributed';
import StatisticsLayout from '../statistics/StatisticsLayout';
import HomeworkIndex from '../statistics/HomeworkIndex';
import NotFound from '../NotFound';
import NotesDoc, { Inline } from './NotesDoc';
import { loadNotes } from './notesText';
import { dsCourse, lectureName, neighbours } from './dsCourse';
import './distributed.css';
import '../../i18n/distributed';

// Il primo blocco ancora in vista e la sua distanza dall'alto della finestra
function blockInView(root) {
  if (!root) return null;
  for (const el of root.querySelectorAll('[data-b]')) {
    const box = el.getBoundingClientRect();
    if (box.bottom > 0) return { index: el.dataset.b, top: box.top };
  }
  return null;
}

function LecturePage({ lecture }) {
  const { t, language } = useLanguage();
  // il testo mostrato: quello dell'ultima lingua arrivata, finche' non
  // arriva quello della lingua appena scelta
  const [doc, setDoc] = useState(null);
  const [failed, setFailed] = useState(false);
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

  // Il nuovo testo e' in pagina, formule comprese: lo stesso blocco di prima
  // torna dov'era
  useLayoutEffect(() => {
    const saved = anchor.current;
    anchor.current = null;
    if (!saved || !articleRef.current) return;
    const el = articleRef.current.querySelector(`[data-b="${saved.index}"]`);
    if (el) window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - saved.top, behavior: 'instant' });
  }, [doc]);

  const toc = useMemo(
    () => doc && {
      sections: doc.sections.map(({ id, level, number, inline }) => ({ id, level, title: <>{number} <Inline nodes={inline} /></> })),
      labels: { button: t('distributed.index'), title: t('distributed.indexTitle'), close: t('distributed.close') },
    },
    [doc, t],
  );

  const backToTop = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    if (titleRef.current) titleRef.current.focus({ preventScroll: true });
  };

  const { prev, next } = neighbours(lecture);
  const short = (other) => `${t('distributed.lecture')} ${other.n}`;
  const to = (other) => `/distributed-systems/${other.slug}`;

  const navBox = (
    <section>
      <ul className="divided">
        <li>
          <article className="box highlight ds-nav-box">
            <header><h3>{t('distributed.navTitle')}</h3></header>
            <p>{`${short(lecture)} ${t('distributed.of')} ${DS_LECTURES.length}`}</p>
            {prev && <Link to={to(prev)} className="button alt icon solid fa-arrow-left" title={lectureName(prev, language, t)}>{short(prev)}</Link>}
            {next && <Link to={to(next)} className="button alt icon solid fa-arrow-right" title={lectureName(next, language, t)}>{short(next)}</Link>}
            <Link to="/distributed-systems" className="button alt icon solid fa-list-ul">{t('distributed.backToList')}</Link>
          </article>
        </li>
      </ul>
    </section>
  );

  return (
    <StatisticsLayout title={lectureName(lecture, language, t)} terminal={[`> cat ${lecture.file}.md`, ...t('distributed.lectureTerminal')]} course={dsCourse(t)} index={toc} sidebar={navBox}>
      <article className="box post th-page ds-doc" ref={articleRef}>
        <header className="hw-title">
          <h2 ref={titleRef} tabIndex={-1}>{lectureName(lecture, language, t)}</h2>
          {toc && <HomeworkIndex sections={toc.sections} labels={toc.labels} />}
        </header>
        <p>{lecture.description[language]}</p>

        {doc && <NotesDoc blocks={doc.blocks} />}
        {!doc && !failed && <p className="hw1-note hw1-pending" role="status">{t('distributed.loading')}</p>}
        {failed && <p className="hw1-note" role="alert">{t('distributed.loadError')}</p>}

        <div className="hw-bottom-actions">
          <Link to="/distributed-systems" className="button alt icon solid fa-arrow-left">{t('distributed.backToList')}</Link>
          {prev && <Link to={to(prev)} className="button alt icon solid fa-angle-left">{short(prev)}</Link>}
          {next && <Link to={to(next)} className="button alt icon solid fa-angle-right">{short(next)}</Link>}
          <button type="button" className="button alt icon solid fa-arrow-up" onClick={backToTop}>{t('distributed.backToTop')}</button>
        </div>
      </article>
    </StatisticsLayout>
  );
}

const DistributedLecture = () => {
  const { slug } = useParams();
  const lecture = DS_LECTURES.find((l) => l.slug === slug);
  if (!lecture) return <NotFound />;
  // la chiave riparte da capo a ogni lezione: testo, indice e scorrimento
  return <LecturePage key={slug} lecture={lecture} />;
};

export default DistributedLecture;
