// src/components/SearchInput.jsx
// Il campo di ricerca delle pagine con un elenco filtrabile (ricette, pizze,
// cocktail, corsi, stampe 3D). Uno solo, cosi' le stesse regole valgono per
// tutti i campi di input del sito.
//
// Il testo digitato serve solo a filtrare in memoria con includes(): non viene
// mai inserito come HTML (React fa l'escape di tutto cio' che mostra), non
// finisce in una query ne' in un eval, e in JavaScript non ci sono buffer da
// far traboccare. Resta una stringa enorme incollata, che rifarebbe il filtro
// a ogni tasto: il limite di lunghezza chiude anche quella. Il taglio in
// onChange copre i casi in cui maxLength non basta, come la composizione IME.
const MAX_LENGTH = 100;

const SearchInput = ({ value, onChange, placeholder, style }) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value.slice(0, MAX_LENGTH))}
    placeholder={placeholder}
    aria-label={placeholder}
    maxLength={MAX_LENGTH}
    autoComplete="off"
    spellCheck={false}
    style={style}
  />
);

export default SearchInput;
