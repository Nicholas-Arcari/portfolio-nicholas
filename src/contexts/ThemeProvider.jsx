import { useEffect, useState } from 'react';
import { ThemeContext } from './themeContext';

// localStorage e' un input come un altro: chiunque puo' scriverci dalla console,
// e con i dati del sito bloccati il browser lancia un'eccezione al solo accesso,
// che qui farebbe cadere l'intera app prima del primo render. Si accetta solo
// un valore noto, e se la memoria non risponde il tema vale per la visita.
const readTheme = () => {
  try {
    return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // Memoria non disponibile: la scelta resta valida fino alla chiusura.
    }
    document.body.classList.toggle('dark-mode', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
