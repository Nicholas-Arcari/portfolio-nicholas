// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Ricette from './pages/Ricette';
import Cocktail from './pages/Cocktail';
import Cocktail_classici from './pages/Cocktail_classici';
import './HackerTheme.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/ricette" element={<Ricette />} />
      <Route path="/cocktail" element={<Cocktail />} />
      <Route path="/cocktail-classici" element={<Cocktail_classici />} />
    </Routes>
  );
}

export default App;