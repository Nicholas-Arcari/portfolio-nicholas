// src/pages/ByteBulk.jsx
import { useLanguage } from '../contexts/languageContext';
import {
  ProductPage, ProductArticle, ProductHero, FeatureList, InstallGuides,
  Collapsible, FaqSections, RequirementsBox, TextBox, ContactBox,
} from './product/ProductKit';
import '../i18n/byteBulk';

const ByteBulk = () => {
  const { t } = useLanguage();

  return (
    <ProductPage
      title={t('byteBulk.heading')}
      terminal={t('byteBulk.terminal')}
      back={t('byteBulk.back')}
      sidebar={(
        <>
          {/* Niente box video come sulle altre pagine prodotto: i video
              sono asset di una GitHub Release e per ByteBulk non esistono,
              quindi al loro posto sta il requisito che conta davvero. */}
          <RequirementsBox title={t('byteBulk.reqTitle')} intro={t('byteBulk.reqIntro')} items={t('byteBulk.reqList')} />

          {/* HTTPS e app installabile: e il vincolo che decide se scanner e
              installazione PWA funzionano, quindi sta in evidenza. */}
          <TextBox icon="fa-mobile-alt" title={t('byteBulk.httpsTitle')} text={t('byteBulk.httpsText')} />

          <TextBox icon="fa-lock" title={t('byteBulk.accessTitle')} text={t('byteBulk.contactNote')} />
          <ContactBox
            title={t('byteBulk.contactTitle')}
            text={t('byteBulk.contact')}
            subject="ByteBulk%20-%20informazioni"
            back={t('byteBulk.back')}
          />
        </>
      )}
    >
      <ProductArticle>
        <ProductHero
          icon="fa-dumbbell"
          heading={t('byteBulk.heading')}
          status={t('byteBulk.status')}
          text={t('byteBulk.text')}
        />
        <FeatureList title={t('byteBulk.productTitle')} items={t('byteBulk.features')} />
      </ProductArticle>

      <InstallGuides
        title={t('byteBulk.howTitle')}
        simple={{ tab: t('byteBulk.tabSimple'), intro: t('byteBulk.simpleIntro'), steps: t('byteBulk.simpleSteps'), note: t('byteBulk.simpleHelp') }}
        tech={{ tab: t('byteBulk.tabTech'), intro: t('byteBulk.techIntro'), steps: t('byteBulk.techSteps'), note: t('byteBulk.techNotes') }}
      />

      <Collapsible title={t('byteBulk.faqTitle')} show={t('byteBulk.faqShow')} hide={t('byteBulk.faqHide')} spaced>
        <FaqSections faq={t('byteBulk.faq')} />
      </Collapsible>
    </ProductPage>
  );
};

export default ByteBulk;
