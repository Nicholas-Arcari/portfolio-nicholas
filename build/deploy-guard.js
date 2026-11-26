// build/deploy-guard.js
// Gira prima di ogni pubblicazione (npm run deploy, tramite predeploy). Il sito
// che va su GitHub Pages deve essere esattamente il main che sta su GitHub:
// gh-pages sostituisce tutto il sito pubblicato, quindi pubblicare da un branch,
// da un main con commit non ancora pushati o rimasto indietro toglierebbe dal
// sito il lavoro di chi ha pubblicato per ultimo, o metterebbe online qualcosa
// che su main non c'e'. Per lo stesso motivo la cartella deve essere pulita:
// una modifica non committata o un file nuovo finirebbero nella build senza
// stare in nessun commit. Il nome del branch non conta (si puo' pubblicare
// anche da un worktree): conta che il commit sia origin/main.
//
// Anche i pacchetti installati devono essere quelli di package-lock.json: la
// build impacchetta React e il router da node_modules, e una cartella rimasta
// indietro (dopo un aggiornamento di sicurezza fatto altrove) pubblicherebbe le
// versioni vecchie anche con il lockfile giusto.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

const fail = (message) => {
  console.error(`\ndeploy-guard: ${message}\nNiente pubblicato.\n`);
  process.exit(1);
};

const dirty = git('status', '--porcelain');
if (dirty) fail(`ci sono modifiche non committate o file nuovi:\n${dirty}`);

try {
  git('fetch', '--quiet', 'origin', 'main');
} catch {
  fail('non riesco ad aggiornare origin/main (manca la rete?): senza il confronto non si pubblica');
}

const head = git('rev-parse', 'HEAD');
const main = git('rev-parse', 'origin/main');
if (head !== main) {
  const [behind, ahead] = git('rev-list', '--left-right', '--count', 'origin/main...HEAD').split(/\s+/).map(Number);
  fail(`il commit da pubblicare non e' origin/main: ${ahead} commit in piu', ${behind} in meno. Fai push o pull e riprova`);
}

// ogni pacchetto del lockfile installato, e nella versione del lockfile
const locked = JSON.parse(readFileSync('package-lock.json', 'utf8')).packages;
const stale = Object.entries(locked)
  .filter(([path, info]) => path.startsWith('node_modules/') && !info.optional && !info.link)
  .filter(([path, info]) => {
    const manifest = `${path}/package.json`;
    return !existsSync(manifest) || JSON.parse(readFileSync(manifest, 'utf8')).version !== info.version;
  })
  .map(([path, info]) => `${path.replace(/^.*node_modules\//, '')} (lockfile ${info.version})`);
if (stale.length) {
  fail(`node_modules non corrisponde a package-lock.json (${stale.length} pacchetti: ${stale.slice(0, 5).join(', ')}${stale.length > 5 ? ', ...' : ''}). Esegui npm ci e riprova`);
}

console.log(`deploy-guard: pubblico ${head.slice(0, 7)}, uguale a origin/main, con i pacchetti del lockfile`);
