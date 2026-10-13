import { useCallback, useEffect, useState } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import { translations } from '../i18n/translations';
import { STATISTICS_HOMEWORK } from '../config/homework';
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

// Gli homework si aprono sempre in inglese, qualunque sia la lingua del resto
// del sito. Il pulsante IT / EN li porta in italiano solo finche' si resta
// sulla pagina: la scelta non si salva e non tocca la lingua del sito.
const HOMEWORK_LANGUAGE = 'en';
const isHomework = (pathname) =>
  STATISTICS_HOMEWORK.some((hw) => matchPath(`/statistics/${hw.slug}`, pathname));

export const LanguageProvider = ({ children }) => {
  const { pathname } = useLocation();
  const [siteLanguage, setSiteLanguage] = useState(readLanguage);
  // La lingua scelta dentro un homework, legata alla pagina in cui e' stata
  // scelta: cambiando pagina si azzera durante il render, come suggerisce
  // React per lo stato che dipende da un valore che cambia, cosi' nessun
  // fotogramma mostra la scelta vecchia.
  const [visit, setVisit] = useState({ pathname, language: null });
  if (visit.pathname !== pathname) setVisit({ pathname, language: null });

  const homework = isHomework(pathname);
  const visitLanguage = visit.pathname === pathname ? visit.language : null;
  const language = homework ? visitLanguage || HOMEWORK_LANGUAGE : siteLanguage;

  const toggleLanguage = () => {
    const next = language === 'it' ? 'en' : 'it';
    if (homework) {
      setVisit({ pathname, language: next });
      return;
    }
    setSiteLanguage(next);
    try {
      localStorage.setItem('lang', next);
    } catch {
      // Memoria non disponibile: la lingua vale per questa visita.
    }
  };

  // La lingua dichiarata nella pagina segue quella mostrata: lettori di
  // schermo e sillabazione leggono il testo con le regole giuste.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

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
