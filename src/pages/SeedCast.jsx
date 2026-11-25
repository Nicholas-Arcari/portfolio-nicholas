// src/pages/SeedCast.jsx
import { useLanguage } from '../contexts/languageContext';
import {
  ProductPage, ProductArticle, ProductHero, FeatureList, InstallGuides,
  Collapsible, FaqSections, RequirementsBox, TextBox, ContactBox,
} from './product/ProductKit';
import '../i18n/seedCast';

const SeedCast = () => {
  const { t } = useLanguage();

  return (
    <ProductPage
      title={t('seedCast.heading')}
      terminal={t('seedCast.terminal')}
      back={t('seedCast.back')}
      sidebar={(
        <>
          <RequirementsBox title={t('seedCast.reqTitle')} intro={t('seedCast.reqIntro')} items={t('seedCast.reqList')} />

          {/* Quanto si spende: in un prodotto BYOK e la prima domanda vera
              (i token li paga chi lo usa) e il vincolo che decide se ha
              senso lanciare una ricerca da duecento attivita. */}
          <TextBox icon="fa-wallet" title={t('seedCast.costTitle')} text={t('seedCast.costText')} />

          <TextBox icon="fa-lock" title={t('seedCast.accessTitle')} text={t('seedCast.contactNote')} />
          <ContactBox
            title={t('seedCast.contactTitle')}
            text={t('seedCast.contact')}
            subject="SeedCast%20-%20informazioni"
            back={t('seedCast.back')}
          />
        </>
      )}
    >
      <ProductArticle>
        <ProductHero
          icon="fa-seedling"
          heading={t('seedCast.heading')}
          status={t('seedCast.status')}
          text={t('seedCast.text')}
        />
        <FeatureList title={t('seedCast.productTitle')} items={t('seedCast.features')} />
      </ProductArticle>

      <InstallGuides
        title={t('seedCast.howTitle')}
        simple={{ tab: t('seedCast.tabSimple'), intro: t('seedCast.simpleIntro'), steps: t('seedCast.simpleSteps'), note: t('seedCast.simpleHelp') }}
        tech={{ tab: t('seedCast.tabTech'), intro: t('seedCast.techIntro'), steps: t('seedCast.techSteps'), note: t('seedCast.techNotes') }}
      />

      <Collapsible title={t('seedCast.faqTitle')} show={t('seedCast.faqShow')} hide={t('seedCast.faqHide')} spaced>
        <FaqSections faq={t('seedCast.faq')} />
      </Collapsible>
    </ProductPage>
  );
};

export default SeedCast;
