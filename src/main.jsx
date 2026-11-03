import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { reloadOnMissingPage } from './utils/reloadOnMissingPage'

import { HashRouter } from 'react-router-dom'

reloadOnMissingPage()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)