// Le traduzioni del sito, una sezione per file in questa cartella, con
// italiano e inglese affiancati. Ogni file chiama register() quando viene
// caricato, e lo importa chi usa i suoi testi: cosi' le sezioni di una pagina
// arrivano insieme alla pagina, invece di stare tutte nel pacchetto iniziale
// del sito, e la Home scarica solo le sue.
// Regola: un file che chiama t('sezione.chiave') importa '<...>/i18n/sezione'.
export const translations = { it: {}, en: {} };

export function register(section, { it, en }) {
  translations.it[section] = it;
  translations.en[section] = en;
}
