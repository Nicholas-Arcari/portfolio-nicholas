import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Content Security Policy del sito pubblicato. GitHub Pages non permette di
// impostare header HTTP, quindi la politica viaggia come <meta> nell'index.html,
// subito dopo il charset e prima di qualunque foglio di stile o script, perche'
// governa solo cio' che viene caricato dopo di lei. Solo in build: il server di
// sviluppo inietta script inline e apre un websocket per il ricaricamento a
// caldo, e questa politica li bloccherebbe.
//
// script-src resta 'self' senza eccezioni: e' la regola che disinnesca un XSS,
// perche' uno script iniettato nella pagina non verrebbe eseguito. Il resto
// elenca solo cio' che il sito carica davvero da fuori: i font Google importati
// dal CSS del template e i video tutorial, serviti dalle release GitHub, che
// rimandano ai propri domini di storage.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "media-src 'self' https://github.com https://objects.githubusercontent.com https://release-assets.githubusercontent.com",
  "connect-src 'self'",
  "object-src 'none'",
  "frame-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  'upgrade-insecure-requests',
].join('; ')

const CHARSET = '<meta charset="UTF-8" />'

const cspMeta = () => ({
  name: 'csp-meta',
  apply: 'build',
  transformIndexHtml(html) {
    // Senza il punto d'aggancio la build deve fallire: pubblicare in silenzio
    // un sito senza politica e' peggio che non pubblicarlo.
    if (!html.includes(CHARSET)) {
      throw new Error(`csp-meta: ${CHARSET} non trovato in index.html`)
    }
    return html.replace(
      CHARSET,
      `${CHARSET}\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
    )
  },
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cspMeta()],
  base: '/portfolio-nicholas/', // <--- Nome del repo
})
