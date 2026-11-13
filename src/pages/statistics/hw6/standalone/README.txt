Homework #6 - Statistics - Nicholas Arcari
Sapienza University of Rome, MSc in Cybersecurity

ITALIANO

L'indipendenza statistica su dati veri di sicurezza informatica: le 22.544
connessioni di rete del test set di NSL-KDD. Si scelgono due variabili X e
F (protocollo, servizio, flag, classe, esito); il programma ne costruisce la
tabella di contingenza, le frequenze marginali e condizionate, le frequenze
attese sotto indipendenza, il chi quadrato con il suo p-value, e accanto il
test G, i test per le tabelle piccole (Fisher, Yates), il test di
permutazione, i residui standardizzati e la V di Cramer. Poi la teoria,
l'interpretazione, la differenza fra associazione e causalita' con il
paradosso di Simpson sulle ammissioni di Berkeley del 1973, il riepilogo dei
test, il contesto storico e le conclusioni. Quattro riquadri "Prova": una
tabella da scrivere o incollare, il rimescolamento di F, una dipendenza
regolabile e Berkeley diviso per dipartimento.

Come si apre
  Estrarre tutto l'archivio in una cartella e aprire index.html con un
  doppio clic: funziona anche offline, senza server. Si apre in inglese;
  IT / EN in alto cambia lingua.

Da terminale
  node homework6.js [--x protocol] [--f class] [--merge] [--seed 2026]
                    [--sample 100] [--perms 2000]
  stampa la tabella di contingenza di X e F, le frequenze condizionate, le
  attese, il chi quadrato, il test G, la V di Cramer, i residui, il test di
  permutazione su un campione, Berkeley e le verifiche. Le variabili sono
  protocol, service, flag, class e outcome.

I dati
  NSL-KDD, file KDDTest+.txt (22.544 record), del Canadian Institute for
  Cybersecurity, University of New Brunswick:
    https://www.unb.ca/cic/datasets/nsl.html
  Il programma ne contiene quattro colonne (protocollo, servizio, flag ed
  etichetta), codificate in homework6.js. La licenza del dataset:
    "You may redistribute, republish, and mirror the ISCX NSL-KDD dataset in
    any form. However, any use or redistribution of the data must include a
    citation to the NSL-KDD dataset and the paper referenced below."
  L'articolo da citare:
    M. Tavallaee, E. Bagheri, W. Lu, A. Ghorbani, "A Detailed Analysis of
    the KDD CUP 99 Data Set", Second IEEE Symposium on Computational
    Intelligence for Security and Defense Applications (CISDA), 2009.
    https://ieeexplore.ieee.org/document/5356528
  Le ammissioni di Berkeley: P. J. Bickel, E. A. Hammel, J. W. O'Connell,
  "Sex Bias in Graduate Admissions: Data from Berkeley", Science 187
  (1975); il dataset UCBAdmissions di R.

Contenuto
  index.html   la pagina
  style.css    lo stile
  homework6.js i dati, i calcoli, i grafici e la riga di comando
  app.js       l'interfaccia e i testi (italiano e inglese)
  README.txt   questo file


ENGLISH

Statistical independence on real cybersecurity data: the 22,544 network
connections of the NSL-KDD test set. Choose two variables X and F
(protocol, service, flag, class, outcome); the program builds their
contingency table, the marginal and conditional frequencies, the expected
frequencies under independence, the chi-square with its p-value, and next
to them the G test, the tests for small tables (Fisher, Yates), the
permutation test, the standardized residuals and Cramer's V. Then the
theory, the interpretation, the difference between association and
causation with Simpson's paradox on the Berkeley admissions of 1973, the
summary of the tests, the historical context and the conclusions. Four
"Try it" boxes: a table to type or paste, the shuffling of F, an adjustable
dependence and Berkeley split by department.

How to open it
  Extract the whole archive into a folder and double click index.html: it
  works offline too, without a server. It opens in English; IT / EN at the
  top changes the language.

From a terminal
  node homework6.js [--x protocol] [--f class] [--merge] [--seed 2026]
                    [--sample 100] [--perms 2000]
  prints the contingency table of X and F, the conditional frequencies, the
  expected ones, the chi-square, the G test, Cramer's V, the residuals, the
  permutation test on a sample, Berkeley and the checks. The variables are
  protocol, service, flag, class and outcome.

The data
  NSL-KDD, file KDDTest+.txt (22,544 records), from the Canadian Institute
  for Cybersecurity, University of New Brunswick:
    https://www.unb.ca/cic/datasets/nsl.html
  The program holds four of its columns (protocol, service, flag and
  label), encoded in homework6.js. The licence of the dataset:
    "You may redistribute, republish, and mirror the ISCX NSL-KDD dataset in
    any form. However, any use or redistribution of the data must include a
    citation to the NSL-KDD dataset and the paper referenced below."
  The paper to cite:
    M. Tavallaee, E. Bagheri, W. Lu, A. Ghorbani, "A Detailed Analysis of
    the KDD CUP 99 Data Set", Second IEEE Symposium on Computational
    Intelligence for Security and Defense Applications (CISDA), 2009.
    https://ieeexplore.ieee.org/document/5356528
  The Berkeley admissions: P. J. Bickel, E. A. Hammel, J. W. O'Connell,
  "Sex Bias in Graduate Admissions: Data from Berkeley", Science 187
  (1975); the dataset UCBAdmissions of R.

Contents
  index.html   the page
  style.css    the style
  homework6.js data, computations, charts and command line
  app.js       interface and texts (Italian and English)
  README.txt   this file
