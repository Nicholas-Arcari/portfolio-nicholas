// src/pages/distributed/dsCourse.js
// Il riepilogo della sidebar delle pagine di Distributed Systems e il
// ritorno al piano di studi della magistrale, con le stesse etichette di
// Statistics.
import { DS_LECTURES } from '../../config/distributed';
import '../../i18n/distributed';
import '../../i18n/masterDetails';
import '../../i18n/statistics';

export const dsCourse = (t) => ({
  summary: [
    [t('statistics.sidebarCoursel'), 'Distributed Systems'],
    [t('statistics.sidebarDegreel'), t('masterDetails.sidebarCourse')],
  ],
  back: {
    to: '/master-details',
    title: t('statistics.sidebarBack'),
    desc: t('statistics.sidebarBackDesc'),
    btn: t('statistics.sidebarBackBtn'),
  },
});

/** "Lecture 3 - Titolo" o "Lezione 3 - Titolo", nella lingua scelta. */
export const lectureName = (lecture, language, t) => `${t('distributed.lecture')} ${lecture.n} - ${lecture.title[language]}`;

/** La lezione prima e quella dopo, se ci sono. */
export const neighbours = (lecture) => {
  const at = DS_LECTURES.indexOf(lecture);
  return { prev: DS_LECTURES[at - 1] || null, next: DS_LECTURES[at + 1] || null };
};
