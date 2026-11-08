import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { reloadOnMissingPage } from './utils/reloadOnMissingPage'
import { markHistoryEntry } from './utils/listMemory'

import { HashRouter } from 'react-router-dom'

reloadOnMissingPage()
markHistoryEntry()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)