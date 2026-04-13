import { useLanguage } from '../contexts/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <section id="footer">
      <div id="copyright" className="container">
        <ul className="links">
          <li>&copy; {new Date().getFullYear()} {t('footer.copyright')}</li>
          <li>{t('footer.design')}</li>
        </ul>
        <p className="footer-privacy">{t('footer.privacy')}</p>
        <p className="footer-license">
          {t('footer.license')}{' '}
          <a href="https://html5up.net/license" target="_blank" rel="noreferrer">
            CCA 3.0
          </a>
        </p>
      </div>
    </section>
  );
};

export default Footer;
