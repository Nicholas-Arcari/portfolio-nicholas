// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Hobby from './pages/Hobby';
import './HackerTheme.css'; // Importa il tuo tema custom

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/hobby" element={<Hobby />} />
    </Routes>
  );
}

export default App;