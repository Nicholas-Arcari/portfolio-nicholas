import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const SettingsBar = () => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <div className="settings-bar">
      <button
        className="settings-btn"
        onClick={toggleTheme}
        title={theme === 'light' ? t('settings.darkMode') : t('settings.lightMode')}
        aria-label={theme === 'light' ? t('settings.darkMode') : t('settings.lightMode')}
      >
        <i className={`icon solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
      </button>

      <button
        className="settings-btn"
        onClick={toggleLanguage}
        title={language === 'it' ? t('settings.langEn') : t('settings.langIt')}
        aria-label={language === 'it' ? t('settings.langEn') : t('settings.langIt')}
      >
        <span className="lang-label">{language === 'it' ? 'EN' : 'IT'}</span>
      </button>
    </div>
  );
};

export default SettingsBar;
