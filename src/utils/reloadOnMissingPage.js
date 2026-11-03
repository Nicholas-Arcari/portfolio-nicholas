// Dopo ogni pubblicazione i file delle pagine cambiano nome e i vecchi spariscono
// dal server. Una scheda aperta da prima (o l'indice che GitHub Pages tiene in
// cache per dieci minuti) chiede un file che non c'e' piu', e la pagina restava
// vuota fino a un refresh. Vite lo segnala con l'evento `vite:preloadError`: il
// sito si ricarica da solo e prende i nomi nuovi. Una volta sola, pero': se dopo
// pochi secondi il file manca ancora, o se manca la rete, l'errore arriva a
// PageError, che mostra un messaggio con il pulsante per riprovare.
const KEY = 'page-reloaded-at';
const PAUSE = 10000;

let reloading = false;

export const isReloading = () => reloading;

export function reloadOnMissingPage() {
  window.addEventListener('vite:preloadError', () => {
    if (!navigator.onLine) return;
    try {
      if (Date.now() - Number(sessionStorage.getItem(KEY) || 0) < PAUSE) return;
      sessionStorage.setItem(KEY, String(Date.now()));
    } catch {
      // senza la memoria della scheda un file che manca davvero ricaricherebbe all'infinito
      return;
    }
    reloading = true;
    window.location.reload();
  });
}
