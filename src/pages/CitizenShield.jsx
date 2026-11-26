// src/pages/CitizenShield.jsx
import { useLanguage } from '../contexts/languageContext';
import {
  ProductPage, ProductArticle, ProductHero, FeatureList, InstallGuides,
  Collapsible, CommandBlock, FaqSections, VideoBox, LicenseBox, ContactBox,
} from './product/ProductKit';
import '../i18n/citizenShield';

const CitizenShield = () => {
  const { t } = useLanguage();
  const downloads = `${import.meta.env.BASE_URL}downloads`;

  return (
    <ProductPage
      title={t('citizenShield.heading')}
      terminal={t('citizenShield.terminal')}
      back={t('citizenShield.back')}
      video={{ unsupported: t('citizenShield.videoUnsupported'), close: t('citizenShield.videoClose') }}
      sidebar={(
        <>
          <VideoBox
            file="citizen-shield"
            title={t('citizenShield.videoTitle')}
            intro={t('citizenShield.videoIntro')}
            windows={t('citizenShield.videoWindows')}
            linux={t('citizenShield.videoLinux')}
          />
          <LicenseBox
            title={t('citizenShield.licenseTitle')}
            text={t('citizenShield.licenseText')}
            eulaHref={`${downloads}/${t('citizenShield.eulaPdf')}`}
            eulaLink={t('citizenShield.eulaLink')}
          />
          <ContactBox
            title={t('citizenShield.contactTitle')}
            text={t('citizenShield.contact')}
            subject="Citizen%20Shield%20-%20richiesta%20accesso%20beta"
            back={t('citizenShield.back')}
          />
        </>
      )}
    >
      <ProductArticle>
        <ProductHero
          icon="fa-user-shield"
          heading={t('citizenShield.heading')}
          status={t('citizenShield.status')}
          text={t('citizenShield.text')}
        />

        {/* Gli 8 moduli */}
        <FeatureList title={t('citizenShield.productTitle')} items={t('citizenShield.features')} />

        {/* Come funziona */}
        <h3 className="product-title">{t('citizenShield.howTitle')}</h3>
        <ul className="product-points is-tight">
          {t('citizenShield.how').map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
        <p className="product-note is-spaced">{t('citizenShield.notes')}</p>

        {/* L'agent locale: perche' esiste, come si esegue, cosa fa ogni modulo */}
        <h3 className="product-title">{t('citizenShield.agentTitle')}</h3>
        <p className="product-intro is-long">{t('citizenShield.agentIntro')}</p>

        <h4 className="product-subtitle">{t('citizenShield.agentFlowTitle')}</h4>
        <ol className="product-flow">
          {t('citizenShield.agentFlow').map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>

        <h4 className="product-subtitle">{t('citizenShield.agentModulesTitle')}</h4>
        <ul className="product-points">
          {t('citizenShield.agentModules').map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
        <p className="product-note is-spaced">{t('citizenShield.agentNote')}</p>
      </ProductArticle>

      <InstallGuides
        title={t('citizenShield.installTitle')}
        simple={{ tab: t('citizenShield.tabSimple'), intro: t('citizenShield.simpleIntro'), steps: t('citizenShield.simpleSteps'), note: t('citizenShield.simpleHelp') }}
        tech={{ tab: t('citizenShield.tabTech'), intro: t('citizenShield.techIntro'), steps: t('citizenShield.techSteps'), note: t('citizenShield.techNotes') }}
        download={{ href: `${downloads}/citizen-shield-deploy.zip`, label: t('citizenShield.downloadBtn'), note: t('citizenShield.downloadNote') }}
      />

      {/* Le immagini dei container: da dove arrivano e come verificarle */}
      <Collapsible title={t('citizenShield.imagesTitle')} show={t('citizenShield.imagesShow')} hide={t('citizenShield.imagesHide')}>
        <p className="product-intro">{t('citizenShield.imagesIntro')}</p>
        <ul className="product-points is-images">
          {t('citizenShield.images').map((img, i) => (
            <li key={i}>{img}</li>
          ))}
        </ul>
        <h4 className="product-subtitle">{t('citizenShield.imagesTrustTitle')}</h4>
        <p className="product-intro is-short">{t('citizenShield.imagesTrustIntro')}</p>
        <CommandBlock last>{t('citizenShield.imagesVerifyCmd')}</CommandBlock>
      </Collapsible>

      <Collapsible title={t('citizenShield.faqTitle')} show={t('citizenShield.faqShow')} hide={t('citizenShield.faqHide')} spaced>
        <FaqSections faq={t('citizenShield.faq')} />
      </Collapsible>
    </ProductPage>
  );
};

export default CitizenShield;
