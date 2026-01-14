// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Ricette from './pages/Ricette';
import Cocktail from './pages/Cocktail';
import Cocktail_classici from './pages/Cocktail_classici';
import Stampe3d from './pages/Stampe3d';
import Pizze from './pages/Pizze';
import './HackerTheme.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/ricette" element={<Ricette />} />
      <Route path="/pizze" element={<Pizze />} />
      <Route path="/cocktail" element={<Cocktail />} />
      <Route path="/cocktail-classici" element={<Cocktail_classici />} />
      <Route path="/stampe3d" element={<Stampe3d />} />
    </Routes>
  );
}

export default App;