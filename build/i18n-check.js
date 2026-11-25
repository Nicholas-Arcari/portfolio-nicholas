// build/i18n-check.js
// Le traduzioni stanno in src/i18n, una sezione per file con italiano e
// inglese affiancati (src/i18n/registry.js). La build si ferma se:
// - una sezione ha chiavi, tipi o elenchi di lunghezza diversi fra italiano e
//   inglese: in una delle due lingue mancherebbe un testo;
// - un file chiama t('sezione.chiave') con una sezione o una chiave che non
//   esiste: la pagina mostrerebbe la chiave al posto del testo;
// - un file usa una sezione senza importarla: i suoi testi ci sarebbero solo
//   dopo aver visitato un'altra pagina che la importa.
// Si controllano le chiamate a t() con la chiave scritta per intero e le
// etichette del menu (src/config/nav.js); le chiavi composte mentre la pagina
// gira, come t(label), restano fuori.
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SRC = fileURLToPath(new URL('../src/', import.meta.url));
const I18N = join(SRC, 'i18n');

async function loadSections() {
  const { translations } = await import(pathToFileURL(join(I18N, 'registry.js')).href);
  for (const file of readdirSync(I18N)) {
    if (file.endsWith('.js') && file !== 'registry.js') await import(pathToFileURL(join(I18N, file)).href);
  }
  return translations;
}

// le differenze di forma fra il testo italiano e quello inglese di una sezione
function compare(it, en, where, errors) {
  if (Array.isArray(it) || Array.isArray(en)) {
    if (!Array.isArray(it) || !Array.isArray(en)) return errors.push(`${where}: elenco solo in una lingua`);
    if (it.length !== en.length) errors.push(`${where}: ${it.length} voci in italiano, ${en.length} in inglese`);
    it.forEach((value, i) => i < en.length && compare(value, en[i], `${where}[${i}]`, errors));
  } else if (it && typeof it === 'object') {
    if (!en || typeof en !== 'object') return errors.push(`${where}: oggetto solo in italiano`);
    for (const key of new Set([...Object.keys(it), ...Object.keys(en)])) {
      if (!(key in en)) errors.push(`${where}.${key}: manca in inglese`);
      else if (!(key in it)) errors.push(`${where}.${key}: manca in italiano`);
      else compare(it[key], en[key], `${where}.${key}`, errors);
    }
  } else if (typeof it !== typeof en) {
    errors.push(`${where}: ${typeof it} in italiano, ${typeof en} in inglese`);
  }
  return errors;
}

const sources = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const path = join(dir, entry.name);
  if (entry.isDirectory()) return path === I18N ? [] : sources(path);
  return /\.(jsx?|mjs)$/.test(entry.name) ? [path] : [];
});

const lookup = (dictionary, key) => key.split('.').reduce((node, part) => (node == null ? node : node[part]), dictionary);

export async function checkTranslations() {
  const translations = await loadSections();
  const errors = [];
  for (const section of Object.keys(translations.it)) compare(translations.it[section], translations.en[section], section, errors);

  for (const file of sources(SRC)) {
    const text = readFileSync(file, 'utf8');
    const name = relative(SRC, file);
    const keys = [...text.matchAll(/\bt\(\s*'([A-Za-z]\w*(?:\.\w+)+)'\s*\)/g)].map((m) => m[1]);
    if (name === join('config', 'nav.js')) keys.push(...[...text.matchAll(/label: '([\w.]+)'/g)].map((m) => m[1]));
    for (const key of new Set(keys)) {
      const section = key.split('.')[0];
      if (!(section in translations.it)) {
        errors.push(`${name}: t('${key}'), la sezione "${section}" non esiste`);
        continue;
      }
      for (const lang of ['it', 'en']) {
        if (lookup(translations[lang], key) == null) errors.push(`${name}: t('${key}') manca in ${lang === 'it' ? 'italiano' : 'inglese'}`);
      }
      const imported = new RegExp(`^import '[./]*i18n/${section}(\\.js)?';$`, 'm').test(text);
      if (!imported && name !== join('config', 'nav.js')) errors.push(`${name}: usa la sezione "${section}" ma non importa i18n/${section}`);
    }
  }
  return [...new Set(errors)];
}

export default function i18nCheck() {
  return {
    name: 'i18n-check',
    apply: 'build',
    async buildStart() {
      const errors = await checkTranslations();
      if (!errors.length) return;
      const shown = errors.slice(0, 30);
      const more = errors.length > shown.length ? `\n  ... e altri ${errors.length - shown.length}` : '';
      throw new Error(`i18n-check: ${errors.length} problemi nelle traduzioni\n  ${shown.join('\n  ')}${more}`);
    },
  };
}
