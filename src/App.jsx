// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Ricette from './pages/Ricette';
import Cocktail from './pages/Cocktail';
import Cocktail_classici from './pages/Cocktail_classici';
import Stampe3d from './pages/Stampe3d';
import Pizze from './pages/Pizze';
import FreelanceDetails from './pages/FreelanceDetails';
import UniversityDetails from './pages/UniversityDetails';
import TemplateScripts from './components/TemplateScripts';
import About from './pages/About';
import './HackerTheme.css';

function App() {
  return (
    <>
      <TemplateScripts />
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ricette" element={<Ricette />} />
        <Route path="/pizze" element={<Pizze />} />
        <Route path="/cocktail" element={<Cocktail />} />
        <Route path="/cocktail-classici" element={<Cocktail_classici />} />
        <Route path="/stampe3d" element={<Stampe3d />} />
        <Route path="/freelance-details" element={<FreelanceDetails />} />
        <Route path="/university-details" element={<UniversityDetails />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </>
  );
}

export default App;