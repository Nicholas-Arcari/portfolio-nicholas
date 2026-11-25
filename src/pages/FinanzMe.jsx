// src/pages/FinanzMe.jsx
import { useLanguage } from '../contexts/languageContext';
import {
  ProductPage, ProductArticle, ProductHero, FeatureList, ArchitectureSection, InstallGuides,
  Collapsible, FaqSections, VideoBox, TextBox, ContactBox,
} from './product/ProductKit';
import '../i18n/finanzMe';

const FinanzMe = () => {
  const { t } = useLanguage();

  return (
    <ProductPage
      title={t('finanzMe.heading')}
      terminal={t('finanzMe.terminal')}
      back={t('finanzMe.back')}
      video={{ unsupported: t('finanzMe.videoUnsupported'), close: t('finanzMe.videoClose') }}
      sidebar={(
        <>
          <VideoBox
            file="finanzme"
            title={t('finanzMe.videoTitle')}
            intro={t('finanzMe.videoIntro')}
            windows={t('finanzMe.videoWindows')}
            linux={t('finanzMe.videoLinux')}
          />
          <TextBox icon="fa-lock" title={t('finanzMe.accessTitle')} text={t('finanzMe.contactNote')} />
          <ContactBox
            title={t('finanzMe.contactTitle')}
            text={t('finanzMe.contact')}
            subject="FinanzMe%20-%20informazioni"
            back={t('finanzMe.back')}
          />
        </>
      )}
    >
      <ProductArticle>
        <ProductHero
          icon="fa-chart-line"
          heading={t('finanzMe.heading')}
          status={t('finanzMe.status')}
          text={t('finanzMe.text')}
        />
        <FeatureList title={t('finanzMe.productTitle')} items={t('finanzMe.features')} />

        {/* Come ci arrivano i dati: l'equivalente della sezione
            sull'architettura nelle altre due pagine. Qui la domanda e'
            chi tocca le credenziali della banca. */}
        <ArchitectureSection
          title={t('finanzMe.architectureTitle')}
          intro={t('finanzMe.architectureIntro')}
          items={t('finanzMe.architecture')}
          note={t('finanzMe.architectureNote')}
        />
      </ProductArticle>

      <InstallGuides
        title={t('finanzMe.howTitle')}
        simple={{ tab: t('finanzMe.tabSimple'), intro: t('finanzMe.simpleIntro'), steps: t('finanzMe.simpleSteps'), note: t('finanzMe.simpleHelp') }}
        tech={{ tab: t('finanzMe.tabTech'), intro: t('finanzMe.techIntro'), steps: t('finanzMe.techSteps'), note: t('finanzMe.techNotes') }}
      />

      <Collapsible title={t('finanzMe.faqTitle')} show={t('finanzMe.faqShow')} hide={t('finanzMe.faqHide')} spaced>
        <FaqSections faq={t('finanzMe.faq')} />
      </Collapsible>
    </ProductPage>
  );
};

export default FinanzMe;
