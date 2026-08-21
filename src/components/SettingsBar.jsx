import { useTheme } from '../contexts/themeContext';
import { useLanguage } from '../contexts/languageContext';

const SettingsBar = () => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <div className="settings-bar">
      <button
        className="settings-btn settings-pill"
        onClick={toggleTheme}
        aria-label={theme === 'light' ? t('settings.darkMode') : t('settings.lightMode')}
      >
        <i className={`icon solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
      </button>

      <button
        className="settings-btn settings-pill"
        onClick={toggleLanguage}
        aria-label={language === 'it' ? t('settings.langEn') : t('settings.langIt')}
      >
        <span className="lang-label">{language === 'it' ? 'EN' : 'IT'}</span>
      </button>
    </div>
  );
};

export default SettingsBar;
