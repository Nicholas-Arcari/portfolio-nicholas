// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Ricette from './pages/Ricette'; // Importa pagina Ricette
import Cocktail from './pages/Cocktail'; // Importa pagina Cocktail
import './HackerTheme.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/ricette" element={<Ricette />} />
      <Route path="/cocktail" element={<Cocktail />} />
    </Routes>
  );
}

export default App;