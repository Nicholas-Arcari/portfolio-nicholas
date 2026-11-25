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
import { execFileSync } from 'node:child_process';

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

console.log(`deploy-guard: pubblico ${head.slice(0, 7)}, uguale a origin/main`);
