import { useCallback, useState } from 'react';
import { translations } from '../i18n/translations';
import { LanguageContext } from './languageContext';

// La lingua salvata indicizza `translations`: un valore arbitrario scritto in
// localStorage (per esempio "constructor") restituirebbe un oggetto che non e'
// un dizionario, e le pagine che si aspettano un elenco cadrebbero. Si accetta
// solo una lingua che esiste; come per il tema, se la memoria del sito e'
// bloccata l'accesso lancia un'eccezione, e allora vale l'italiano.
const readLanguage = () => {
  try {
    return localStorage.getItem('lang') === 'en' ? 'en' : 'it';
  } catch {
    return 'it';
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(readLanguage);

  const toggleLanguage = () => {
    setLanguage(prev => {
      const next = prev === 'it' ? 'en' : 'it';
      try {
        localStorage.setItem('lang', next);
      } catch {
        // Memoria non disponibile: la lingua vale per questa visita.
      }
      return next;
    });
  };

  const t = useCallback((key) => {
    const keys = key.split('.');
    let result = translations[language];
    for (const k of keys) {
      if (result == null) return key;
      result = result[k];
    }
    return result ?? key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
