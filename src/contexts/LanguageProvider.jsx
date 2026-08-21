import { useCallback, useState } from 'react';
import { translations } from '../i18n/translations';
import { LanguageContext } from './languageContext';

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem('lang') || 'it');

  const toggleLanguage = () => {
    setLanguage(prev => {
      const next = prev === 'it' ? 'en' : 'it';
      localStorage.setItem('lang', next);
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
