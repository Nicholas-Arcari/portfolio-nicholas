// src/pages/statistics/hw1/task.js
// I parametri della consegna dell'Homework #1 - Exercise 1, in un modulo a parte: li usano
// i calcoli (homework1.js), i testi e l'elenco degli homework, che cosi'
// citano gli stessi numeri senza dover caricare tutto il resto.

/** The parameters given in the assignment: y^2 = x^3 + 7 (mod 17), G = (1, 5), k = 6. */
export const TASK = Object.freeze({ p: 17, a: 0, b: 7, G: Object.freeze({ x: 1, y: 5 }), k: 6 });
