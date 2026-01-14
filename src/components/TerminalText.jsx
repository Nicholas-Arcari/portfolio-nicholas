// src/components/TerminalText.jsx
import React, { useState, useEffect } from 'react';

const TerminalText = ({ lines, speed = 50, pause = 300 }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
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
  }, [charIndex, lineIndex, lines, speed, pause]);

  return (
    <p className="terminal-container">
      {displayedText}
      <span className="cursor"></span>
    </p>
  );
};

export default TerminalText;