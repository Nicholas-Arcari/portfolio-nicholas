import { useEffect, useState } from 'react';
import { ThemeContext } from './themeContext';

// localStorage e' un input come un altro: chiunque puo' scriverci dalla console,
// e con i dati del sito bloccati il browser lancia un'eccezione al solo accesso,
// che qui farebbe cadere l'intera app prima del primo render. Si accetta solo
// un valore noto, e se la memoria non risponde il tema vale per la visita.
const readSaved = () => {
  try {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || saved === 'light' ? saved : null;
  } catch {
    return null;
  }
};

// Finche' chi visita non sceglie, il tema e' quello del sistema operativo, e lo
// segue anche se cambia durante la visita (il passaggio automatico alla sera).
const DARK = '(prefers-color-scheme: dark)';
const systemTheme = () => (window.matchMedia?.(DARK).matches ? 'dark' : 'light');

export const ThemeProvider = ({ children }) => {
  const [chosen, setChosen] = useState(readSaved);
  const [system, setSystem] = useState(systemTheme);
  const theme = chosen || system;

  useEffect(() => {
    if (chosen || !window.matchMedia) return undefined;
    const query = window.matchMedia(DARK);
    const follow = () => setSystem(query.matches ? 'dark' : 'light');
    query.addEventListener('change', follow);
    return () => query.removeEventListener('change', follow);
  }, [chosen]);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', theme === 'dark');
  }, [theme]);

  // Si salva solo una scelta vera, fatta col pulsante: il tema del sistema
  // salvato da solo diventerebbe una scelta che nessuno ha fatto.
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setChosen(next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Memoria non disponibile: la scelta resta valida fino alla chiusura.
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
