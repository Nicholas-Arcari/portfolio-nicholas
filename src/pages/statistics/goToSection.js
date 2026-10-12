// src/pages/statistics/goToSection.js
// Il salto a una sezione di un homework, condiviso dall'indice
// (HomeworkIndex.jsx) e dai collegamenti interni delle pagine. Un semplice
// href="#sezione" non va: il router usa proprio l'hash dell'indirizzo, e lo
// prenderebbe per una rotta.

const FOLLOW_MS = 2500;

// Porta il titolo in cima e lo segue per un paio di secondi: se nel
// frattempo qualcosa sopra cambia altezza (il terminale dell'intestazione che
// scrive una riga, un grafico che finisce di disegnarsi), lo scorrimento
// riparte verso la nuova posizione invece di fermarsi storto. Se l'utente
// scorre da se', si smette subito di inseguire.
function scrollToSection(target) {
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  const userEvents = ['wheel', 'touchstart', 'keydown', 'mousedown'];
  const started = performance.now();
  let stopped = false;
  let lastTop = target.getBoundingClientRect().top + window.scrollY;
  const stop = () => {
    stopped = true;
    userEvents.forEach((type) => window.removeEventListener(type, stop));
  };
  userEvents.forEach((type) => window.addEventListener(type, stop, { passive: true }));
  target.scrollIntoView({ behavior, block: 'start' });
  const follow = () => {
    if (stopped) return;
    if (performance.now() - started > FOLLOW_MS) {
      stop();
      return;
    }
    const top = target.getBoundingClientRect().top + window.scrollY;
    if (Math.abs(top - lastTop) > 1) {
      lastTop = top;
      target.scrollIntoView({ behavior, block: 'start' });
    }
    requestAnimationFrame(follow);
  };
  requestAnimationFrame(follow);
}

/**
 * Porta alla sezione con questo id: focus sul titolo, scorrimento che lo
 * insegue e un lampo breve, come per la ruota della fortuna. La usano
 * l'indice e i collegamenti interni delle pagine (un href="#..." cambierebbe
 * la rotta, perche' il router usa proprio l'hash dell'indirizzo).
 */
export function goToSection(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.focus({ preventScroll: true });
  scrollToSection(target);
  target.classList.remove('hw-index-target');
  void target.offsetWidth;
  target.classList.add('hw-index-target');
  target.addEventListener('animationend', () => target.classList.remove('hw-index-target'), { once: true });
}
