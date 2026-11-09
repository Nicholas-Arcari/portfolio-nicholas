// src/pages/statistics/Project1.jsx
// Il primo project di Statistics, un progetto di gruppo: The Anomaly Guard. Il
// codice sta nel suo repository (github.com/Nicholas-Arcari/anomaly-guard) e qui
// non se ne copia niente: la pagina mostra in un iframe la demo che quel
// repository pubblica su GitHub Pages, e ogni nuova pubblicazione compare qui
// da sola. Nella sidebar, come negli homework, il riquadro col codice: qui e'
// il link al repository invece dello zip.
//
// L'iframe e' isolato (sandbox senza allow-same-origin): la demo gira come
// un'origine a se', senza accesso a questa pagina, ai cookie o allo storage del
// portfolio, pur stando sullo stesso dominio nicholas-arcari.github.io. Le
// basta allow-scripts (impostazioni e pagine passano dall'indirizzo, non dallo
// storage); allow-popups e allow-popups-to-escape-sandbox servono ai suoi link
// "Source code", che aprono GitHub in una nuova scheda. La CSP del sito
// (vite.config.js) permette di incorporare solo questo indirizzo.
import React from 'react';
import { useLanguage } from '../../contexts/languageContext';
import HomeworkShell from './HomeworkShell';

const DEMO = 'https://nicholas-arcari.github.io/anomaly-guard/';
const REPO = 'https://github.com/Nicholas-Arcari/anomaly-guard';

const Project1 = () => {
  const { t } = useLanguage();

  const sidebar = (
    <section>
      <ul className="divided">
        <li>
          <article className="box highlight hw1-download">
            <header><h3>{t('statistics.project1CodeTitle')}</h3></header>
            <p>{t('statistics.project1CodeText')}</p>
            <a href={REPO} target="_blank" rel="noopener noreferrer" className="button icon brands fa-github">{t('statistics.project1Repo')}</a>
            <a href={DEMO} target="_blank" rel="noopener noreferrer" className="button alt icon solid fa-external-link-alt">{t('statistics.project1Open')}</a>
          </article>
        </li>
      </ul>
    </section>
  );

  return (
    <HomeworkShell slug="project-1" sidebar={sidebar}>
      <p>{t('statistics.project1Intro')}</p>
      <iframe
        className="project-demo"
        src={DEMO}
        title={t('statistics.project1FrameTitle')}
        loading="lazy"
        referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      />
      <p className="project-demo-note">{t('statistics.project1Note')}</p>
    </HomeworkShell>
  );
};

export default Project1;
