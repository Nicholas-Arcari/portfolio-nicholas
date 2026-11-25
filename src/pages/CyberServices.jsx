// src/pages/CyberServices.jsx
import { useLanguage } from '../contexts/languageContext';
import {
  ProductPage, ProductArticle, ProductHero, FeatureList, ArchitectureSection, InstallGuides,
  Collapsible, CommandBlock, FaqSections, VideoBox, LicenseBox, ContactBox,
} from './product/ProductKit';
import '../i18n/cyberServices';

const CyberServices = () => {
  const { t } = useLanguage();
  const downloads = `${import.meta.env.BASE_URL}downloads`;

  return (
    <ProductPage
      title={t('cyberServices.heading')}
      terminal={t('cyberServices.terminal')}
      back={t('cyberServices.back')}
      video={{ unsupported: t('cyberServices.videoUnsupported'), close: t('cyberServices.videoClose') }}
      sidebar={(
        <>
          <VideoBox
            file="soc-suite"
            title={t('cyberServices.videoTitle')}
            intro={t('cyberServices.videoIntro')}
            windows={t('cyberServices.videoWindows')}
            linux={t('cyberServices.videoLinux')}
          />
          <LicenseBox
            title={t('cyberServices.licenseTitle')}
            text={t('cyberServices.licenseText')}
            eulaHref={`${downloads}/${t('cyberServices.eulaPdf')}`}
            eulaLink={t('cyberServices.eulaLink')}
          />
          <ContactBox
            title={t('cyberServices.contactTitle')}
            text={t('cyberServices.contact')}
            subject="SOC%20Suite%20-%20richiesta%20licenza"
            back={t('cyberServices.back')}
          />
        </>
      )}
    >
      <ProductArticle>
        <ProductHero icon="fa-shield-alt" heading={t('cyberServices.heading')} text={t('cyberServices.text')} />
        <FeatureList title={t('cyberServices.productTitle')} items={t('cyberServices.features')} />

        {/* Com'e' fatta: l'equivalente della sezione sull'agent nella
            pagina di Citizen Shield, che spiegava perche' esiste e cosa
            fa. Qui la domanda e' dove finiscono i dati. */}
        <ArchitectureSection
          title={t('cyberServices.architectureTitle')}
          intro={t('cyberServices.architectureIntro')}
          items={t('cyberServices.architecture')}
          note={t('cyberServices.architectureNote')}
        />
      </ProductArticle>

      <InstallGuides
        title={t('cyberServices.howTitle')}
        simple={{ tab: t('cyberServices.tabSimple'), intro: t('cyberServices.simpleIntro'), steps: t('cyberServices.simpleSteps'), note: t('cyberServices.simpleHelp') }}
        tech={{ tab: t('cyberServices.tabTech'), intro: t('cyberServices.techIntro'), steps: t('cyberServices.techSteps'), note: t('cyberServices.techNotes') }}
        download={{ href: `${downloads}/soc-suite-deploy.zip`, label: t('cyberServices.downloadBtn'), note: t('cyberServices.downloadNote') }}
      />

      {/* Le immagini dei container: da dove arrivano e come verificarle */}
      <Collapsible title={t('cyberServices.imagesTitle')} show={t('cyberServices.imagesShow')} hide={t('cyberServices.imagesHide')}>
        <p className="product-intro">{t('cyberServices.imagesIntro')}</p>
        <ul className="product-points is-images">
          {t('cyberServices.images').map((img, i) => (
            <li key={i}>{img}</li>
          ))}
        </ul>

        <h4 className="product-subtitle">{t('cyberServices.imagesTrustTitle')}</h4>
        <p className="product-intro is-short">{t('cyberServices.imagesTrustIntro')}</p>
        <CommandBlock>{t('cyberServices.imagesVerifyCmd')}</CommandBlock>
        <p className="product-note is-last">{t('cyberServices.imagesTrustNote')}</p>
      </Collapsible>

      <Collapsible title={t('cyberServices.faqTitle')} show={t('cyberServices.faqShow')} hide={t('cyberServices.faqHide')} spaced>
        <FaqSections faq={t('cyberServices.faq')} />
      </Collapsible>
    </ProductPage>
  );
};

export default CyberServices;
