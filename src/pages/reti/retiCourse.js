// src/pages/reti/retiCourse.js
// Il riepilogo della sidebar delle pagine di Reti di Calcolatori e il ritorno
// al piano di studi della triennale. Docente e anno accademico sono quelli
// del README del laboratorio.
export const retiCourse = (t) => ({
  summary: [
    [t('reti.sidebarCoursel'), t('reti.course')],
    [t('reti.sidebarDegreel'), t('university.sidebarCourse')],
    [t('reti.sidebarTeacherl'), 'Prof. Roberto Alfieri'],
    [t('reti.sidebarYearl'), '2024/2025'],
  ],
  back: {
    to: '/university-details',
    title: t('reti.sidebarBack'),
    desc: t('reti.sidebarBackDesc'),
    btn: t('reti.sidebarBackBtn'),
  },
});
