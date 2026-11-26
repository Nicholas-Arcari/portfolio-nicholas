// build/not-found.js
// GitHub Pages mostra 404.html per ogni indirizzo del sito che non esiste. Le
// pagine del portfolio stanno dopo il # (HashRouter): chi apre
// /portfolio-nicholas/about, da un link scritto a mano o copiato senza il #,
// trovava la pagina d'errore generica di GitHub. Questa 404 lo porta subito a
// /portfolio-nicholas/#/about, dove il sito mostra la pagina, o la sua pagina
// "non esiste" se l'indirizzo e' sbagliato davvero.
//
// L'indirizzo base viene dalla configurazione di Vite, e la CSP della pagina
// ammette solo questo script, con la sua impronta SHA-256 calcolata qui: chi
// cambia lo script non deve aggiornare niente a mano. Senza JavaScript restano
// i link al portfolio.
import { createHash } from 'node:crypto';

export default function notFound() {
  let base = '/';
  return {
    name: 'not-found',
    apply: 'build',
    configResolved(config) {
      base = config.base;
    },
    generateBundle() {
      const script = [
        `var base = ${JSON.stringify(base)};`,
        'var path = location.pathname;',
        'if (path.indexOf(base) === 0) {',
        "  var route = path.slice(base.length).replace(/\\/+$/, '');",
        "  location.replace(base + '#/' + route);",
        '}',
      ].join('\n');
      const hash = createHash('sha256').update(script).digest('base64');
      const csp = `default-src 'none'; script-src 'sha256-${hash}'; base-uri 'none'; form-action 'none'`;
      const html = `<!doctype html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="${csp}" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <title>Nicholas Arcari - Portfolio</title>
    <script>${script}</script>
  </head>
  <body>
    <p>Questa pagina non esiste: <a href="${base}">vai al portfolio</a>.</p>
    <p lang="en">This page does not exist: <a href="${base}">go to the portfolio</a>.</p>
  </body>
</html>
`;
      this.emitFile({ type: 'asset', fileName: '404.html', source: html });
    },
  };
}
