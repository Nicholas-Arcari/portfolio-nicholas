HOMEWORK #1 - STATISTICS
Dalla chiave privata alla chiave pubblica: moltiplicazione scalare su curva
ellittica, come in Ethereum.
Nicholas Arcari - Laurea magistrale in Cybersecurity, Sapienza Università di Roma

(English below)


CONTENUTO

  index.html     la pagina: si apre con un doppio clic, anche offline
  style.css      lo stile, con tema chiaro e scuro, per computer e telefono
  homework1.js   i calcoli: curva giocattolo, somma di punti, G, 2G, ..., kG,
                 double-and-add, TOY PUBLIC KEY, ricerca esaustiva di k,
                 esplorazione statistica, animazione e riga di comando
  app.js         l'interfaccia e i testi, in italiano e in inglese
  README.txt     questo file


COME SI USA

  Nel browser: aprire index.html. La lingua si cambia con IT / EN in alto,
  e il pulsante Indice porta a qualunque sezione della consegna.

  Da terminale, con Node.js 14 o successivo:

    node homework1.js            i parametri della consegna: k = 6, p = 17
    node homework1.js 13 97      k = 13 sulla curva y^2 = x^3 + 7 (mod 97)

  Il programma stampa G, 2G, ..., kG, i passi del double-and-add, la
  TOY PUBLIC KEY, la ricerca esaustiva di k e una sintesi dell'esplorazione
  statistica. k deve essere un intero positivo scritto in cifre decimali,
  p uno fra 17, 97, 991 e 10477: qualunque altro valore viene rifiutato.


NOTE

  Nessuna dipendenza, nessuna connessione di rete, nessun dato salvato
  tranne la lingua scelta. homework1.js e app.js sono generati dagli stessi
  sorgenti della pagina online, quindi i numeri e i testi coincidono:
  https://nicholas-arcari.github.io/portfolio-nicholas/#/statistics/homework-1


---------------------------------------------------------------------------


CONTENTS

  index.html     the page: it opens with a double click, even offline
  style.css      the style, with light and dark theme, for computer and phone
  homework1.js   the computations: toy curve, point addition, G, 2G, ..., kG,
                 double-and-add, TOY PUBLIC KEY, brute-force search for k,
                 statistical exploration, animation and command line
  app.js         the interface and the texts, in Italian and English
  README.txt     this file


HOW TO USE IT

  In a browser: open index.html. IT / EN at the top switches language, and
  the Contents button jumps to any section of the assignment.

  From a terminal, with Node.js 14 or later:

    node homework1.js            the assignment's parameters: k = 6, p = 17
    node homework1.js 13 97      k = 13 on the curve y^2 = x^3 + 7 (mod 97)

  The program prints G, 2G, ..., kG, the steps of double-and-add, the
  TOY PUBLIC KEY, the brute-force search for k and a summary of the
  statistical exploration. k must be a positive integer written in decimal
  digits, p one of 17, 97, 991 and 10477: any other value is refused.


NOTES

  No dependencies, no network connection, nothing stored except the chosen
  language. homework1.js and app.js are generated from the same sources as
  the online page, so numbers and texts match:
  https://nicholas-arcari.github.io/portfolio-nicholas/#/statistics/homework-1
