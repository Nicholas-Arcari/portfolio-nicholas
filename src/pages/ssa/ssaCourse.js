// src/pages/ssa/ssaCourse.js
// Il riepilogo della sidebar delle pagine di Security in Software
// Applications e il ritorno al piano di studi della magistrale, con le stesse
// etichette di Statistics e di Distributed Systems.
import { SSA_LECTURES } from '../../config/ssa';
import '../../i18n/masterDetails';
import '../../i18n/ssa';
import '../../i18n/statistics';

export const SSA_PATH = '/security-in-software-applications';

export const ssaCourse = (t) => ({
  summary: [
    [t('statistics.sidebarCoursel'), 'Security in Software Applications'],
    [t('statistics.sidebarDegreel'), t('masterDetails.sidebarCourse')],
  ],
  back: {
    to: '/master-details',
    title: t('statistics.sidebarBack'),
    desc: t('statistics.sidebarBackDesc'),
    btn: t('statistics.sidebarBackBtn'),
  },
});

/** "Lecture 3", "Lezione 19 (parte 2)": il numero della lezione, nella lingua scelta. */
export const lectureNumber = (lecture, t) => `${t('ssa.lecture')} ${lecture.n}${lecture.part ? ` (${t('ssa.part')} ${lecture.part})` : ''}`;

/** "Lecture 3 - Titolo" o "Lezione 3 - Titolo", nella lingua scelta. */
export const lectureName = (lecture, language, t) => `${lectureNumber(lecture, t)} - ${lecture.title[language]}`;

/** La lezione prima e quella dopo, se ci sono. */
export const neighbours = (lecture) => {
  const at = SSA_LECTURES.indexOf(lecture);
  return { prev: SSA_LECTURES[at - 1] || null, next: SSA_LECTURES[at + 1] || null };
};

/** Quante lezioni ha il corso: la seconda parte della 19 non conta. */
export const lectureCount = () => SSA_LECTURES.filter((lecture) => !lecture.part).length;
