// src/utils/listMemory.js
// La memoria delle pagine con un elenco (statistics, reti, piani di studio,
// ricette, pizze, cocktail, stampe 3D): la ricerca, i filtri, le sezioni
// aperte e il punto di scorrimento tornano quando si torna alla pagina con
// Indietro o Avanti del browser (o ricaricandola). Una visita nuova, da un
// link, dal menu o dal pulsante "Tutti gli homework", parte invece pulita,
// dall'inizio della pagina.
//
// Ogni voce della cronologia ha la sua chiave (quella di React Router, o una
// data qui), e la memoria sta in sessionStorage sotto quella chiave: vive
// quanto la scheda, non passa ad altre schede ne' ai link condivisi, e
// l'indirizzo resta quello di sempre. Le voci ricordate sono al piu' KEEP:
// le piu' vecchie si dimenticano.
import { useEffect, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const STORE = 'portfolio.lists';
const KEEP = 40;

// Senza cronologia (storage o history bloccati) ogni voce e' anonima e
// nulla si ricorda.
const ANONYMOUS = 'default';

const newKey = () => Math.random().toString(36).slice(2, 10);

/**
 * The key of the history entry being shown. React Router calls "default"
 * every entry without a state: the first page of the tab, an address typed
 * by hand, a link of the menu that the template clones outside React. Those
 * entries get a key of their own here, written in their state, so that Back
 * finds them again like any other.
 */
function entryKey() {
  try {
    const state = window.history.state;
    if (state && state.key) return state.key;
    const key = newKey();
    window.history.replaceState({ ...(state || {}), key }, '');
    return key;
  } catch {
    return ANONYMOUS;
  }
}

// Quanto a lungo si riprova a tornare al punto giusto mentre la pagina
// cresce (immagini, caratteri), se chi legge non si muove prima.
const RESTORE_MS = 2000;

const empty = () => ({ tick: 0, entries: {} });

function load() {
  try {
    const data = JSON.parse(window.sessionStorage.getItem(STORE));
    return data && typeof data === 'object' && data.entries && typeof data.entries === 'object' ? data : empty();
  } catch {
    return empty();
  }
}

/** What this history entry holds for this page, or null. */
function recall(key, pathname) {
  if (key === ANONYMOUS) return null;
  const entry = load().entries[key];
  return entry && entry.path === pathname ? entry : null;
}

/** Changes what this history entry holds for this page, and forgets the oldest entries beyond KEEP. */
function update(key, pathname, change) {
  if (key === ANONYMOUS) return;
  const data = load();
  const old = data.entries[key];
  const entry = old && old.path === pathname ? old : { path: pathname, values: {}, scrollY: null };
  change(entry);
  data.tick += 1;
  entry.tick = data.tick;
  data.entries[key] = entry;
  const keys = Object.keys(data.entries);
  if (keys.length > KEEP) {
    keys.sort((a, b) => data.entries[a].tick - data.entries[b].tick).slice(0, keys.length - KEEP).forEach((k) => delete data.entries[k]);
  }
  try {
    window.sessionStorage.setItem(STORE, JSON.stringify(data));
  } catch {
    // memoria piena o bloccata (navigazione privata): questa visita non si ricorda
  }
}

/**
 * Gives the history entry the page opened on a key of its own, before the
 * router starts. Without it a page opened from a bookmark or a link would be
 * "default" like every other first page of the tab, and could find the
 * filters of an earlier visit. Called once in main.jsx.
 */
export function markHistoryEntry() {
  try {
    const state = window.history.state;
    if (!state || !state.key) window.history.replaceState({ ...(state || {}), key: newKey() }, '');
  } catch {
    // senza cronologia ogni voce resta anonima e nulla si ricorda
  }
}

/** The history entry the page is shown in, and whether it is shown again (Back, Forward, a reload) rather than visited anew: read once, when the page mounts. */
function useEntry() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const [entry] = useState(() => ({ key: entryKey(), pathname: location.pathname, again: navigationType === 'POP' }));
  return entry;
}

/**
 * A value of a list page (a search, a filter, an open section) that comes
 * back with Back or Forward, and starts from `initial` on a new visit.
 * `isValid` checks a remembered value before it is used (a filter that no
 * longer exists, a value of another type): by default the type of `initial`.
 */
export function useRemembered(name, initial, isValid = (v) => typeof v === typeof initial) {
  const entry = useEntry();
  const [value, setValue] = useState(() => {
    const saved = entry.again ? recall(entry.key, entry.pathname) : null;
    if (!saved || !Object.prototype.hasOwnProperty.call(saved.values, name)) return initial;
    const v = saved.values[name];
    return isValid(v) ? v : initial;
  });
  useEffect(() => {
    update(entry.key, entry.pathname, (e) => {
      e.values[name] = value;
    });
  }, [entry, name, value]);
  return [value, setValue];
}

/**
 * The scroll of a list page: back at the point it was left with Back or
 * Forward, at the top on a new visit. If the page is not yet tall enough
 * (pictures still loading) it tries again as the page grows, for
 * RESTORE_MS, unless the reader scrolls first; meanwhile it does not
 * overwrite the remembered point.
 */
export function useRememberedScroll() {
  const entry = useEntry();
  useEffect(() => {
    const saved = entry.again ? recall(entry.key, entry.pathname) : null;
    const target = saved && Number.isFinite(saved.scrollY) ? saved.scrollY : 0;
    const reached = () => Math.abs(window.scrollY - target) < 2;
    let restoring = true;
    let frame = 0;
    window.scrollTo(0, target);

    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => {
      if (!restoring) return;
      window.scrollTo(0, target);
      if (reached()) finish();
    }) : null;
    const INPUTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
    let timer = 0;
    function finish() {
      restoring = false;
      if (observer) observer.disconnect();
      clearTimeout(timer);
      INPUTS.forEach((type) => window.removeEventListener(type, finish));
    }
    if (reached() || !observer) {
      finish();
    } else {
      observer.observe(document.body);
      timer = setTimeout(finish, RESTORE_MS);
      INPUTS.forEach((type) => window.addEventListener(type, finish, { passive: true }));
    }

    // Leaving the page moves the scroll too: the next page goes to the top,
    // Back lets the browser restore the point of the entry it returns to,
    // and React unmounts this page only afterwards. Those moves belong to
    // another entry, so the point is saved only while this entry is the one
    // shown, which the history knows before React does.
    const current = () => {
      try {
        return !!window.history.state && window.history.state.key === entry.key;
      } catch {
        return false;
      }
    };
    const save = () => {
      if (restoring || frame || !current()) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!current()) return;
        update(entry.key, entry.pathname, (e) => {
          e.scrollY = Math.round(window.scrollY);
        });
      });
    };
    window.addEventListener('scroll', save, { passive: true });
    return () => {
      finish();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', save);
    };
  }, [entry]);
}
