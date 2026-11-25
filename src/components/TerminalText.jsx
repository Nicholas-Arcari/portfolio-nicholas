// src/components/TerminalText.jsx
import React, { useState, useEffect } from 'react';

// Con "riduci movimento" attivo nel sistema il testo compare subito intero,
// senza la scrittura lettera per lettera.
const prefersStill = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const TerminalText = ({ lines, speed = 50, pause = 300 }) => {
  const [still] = useState(prefersStill);
  const [displayedText, setDisplayedText] = useState('');
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (still) return undefined;
    if (lineIndex < lines.length) {
      if (charIndex < lines[lineIndex].length) {
        const timeout = setTimeout(() => {
          setDisplayedText((prev) => prev + lines[lineIndex][charIndex]);
          setCharIndex((prev) => prev + 1);
        }, speed);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => {
          setDisplayedText((prev) => prev + '\n');
          setLineIndex((prev) => prev + 1);
          setCharIndex(0);
        }, pause);
        return () => clearTimeout(timeout);
      }
    }
    return undefined;
  }, [still, charIndex, lineIndex, lines, speed, pause]);

  const shown = still ? lines.map((line) => `${line}\n`).join('') : displayedText;

  // La scrittura animata e' solo per gli occhi: un lettore di schermo legge
  // il testo intero, subito, dalla copia nascosta.
  return (
    <p className="terminal-container">
      <span aria-hidden="true">
        {shown}
        <span className="cursor"></span>
      </span>
      <span className="visually-hidden">{lines.join(' ')}</span>
    </p>
  );
};

export default TerminalText;
