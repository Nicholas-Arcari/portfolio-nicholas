// src/config/symbols.js
// Pool di simboli usati dalle pagine cucina/cocktail: ogni elemento riceve il
// simbolo corrispondente alla sua posizione nell'elenco, e lo stesso simbolo
// compare sia accanto al nome sia sullo spicchio della Ruota della Fortuna.
// Aggiungendo nuove ricette/pizze/cocktail non serve toccare le pagine: basta
// che il pool sia abbastanza lungo da coprirle (altrimenti i simboli si
// ripetono ciclicamente, senza rompere nulla).

export const FOOD_SYMBOLS = [
  '🍎', '🍰', '🍝', '🍲', '🧀', '🥧', '🍮', '🥘', '🍜', '🍛',
  '🍚', '🍞', '🥔', '🎃', '🥣',
];

export const PIZZA_SYMBOLS = [
  '🍕', '🔥', '🧀', '🌶️', '🍅', '🫒', '🥓', '🍄', '🧄', '🌿',
  '🥬', '🫓', '🌾', '🧅', '🥑',
];

export const DRINK_SYMBOLS = [
  '🍸', '🍹', '🍺', '🥃', '🍶', '🧉', '🍾', '🥂', '🍋', '🍊',
  '🍒', '🍓', '☕', '🍷', '🥤', '🫗', '🍏', '🍍', '🥥', '🌿',
  '🧊', '🫐', '🍇', '🥭', '🌰', '🍯',
];

// Applica i simboli a una lista, per indice.
export const withSymbols = (items, pool) =>
  items.map((item, i) => ({ ...item, sym: pool[i % pool.length] }));
