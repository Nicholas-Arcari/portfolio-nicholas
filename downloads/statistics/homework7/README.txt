Homework #7 - Statistics - Nicholas Arcari
Sapienza University of Rome, MSc in Cybersecurity

ITALIANO

Due parti, come la consegna. La prima spiega le forme di convergenza della
teoria della probabilita' (in probabilita', quasi certa, in media
quadratica, in distribuzione) con i controesempi e la mappa delle
implicazioni; il loro ruolo nella legge dei grandi numeri, nel teorema del
limite centrale e in altri risultati della statistica (consistenza,
Slutsky, metodo delta, Glivenko-Cantelli, normalita' dello stimatore di
massima verosimiglianza); e perche' compare la radice di n: la varianza che
si somma grazie all'indipendenza, gli allarmi a raffica quando
l'indipendenza manca, le code pesanti e la velocita' della convergenza. La
seconda tratta la probabilita' condizionata (la catena di un attacco,
l'indipendenza condizionata, il p-value contro P(H0 | dati)), il teorema di
Bayes con prior, verosimiglianza e posterior, e i suoi esempi: l'allarme di
un IDS e il tasso di base, una rete bayesiana per il triage, il test
sequenziale di Wald, il tasso di click di un phishing con prior diversi, il
confronto con gli intervalli frequentisti, due filtri naive Bayes su dati
veri (SMS e NSL-KDD), vantaggi, limiti e influenza del prior, e il
posterior che converge (Bernstein-von Mises). Dodici riquadri "Prova"
lasciano mettere le mani sui numeri.

Come si apre
  Estrarre tutto l'archivio in una cartella e aprire index.html con un
  doppio clic: funziona anche offline, senza server. Si apre in inglese;
  IT / EN in alto cambia lingua. Le simulazioni lunghe girano a fette
  mentre la pagina e' gia' leggibile: le sezioni che ne hanno bisogno si
  riempiono in pochi secondi.

Da terminale
  node homework7.js [--seed 2026 | --random-seed]
  stampa, nell'ordine della pagina, le forme di convergenza, la radice di
  n e le raffiche, gli altri risultati della statistica, la probabilita'
  condizionata, l'allarme, la rete, il test di Wald, la campagna, le
  coperture, i due filtri e le verifiche.

I dati
  SMS Spam Collection v.1 (5.574 SMS in inglese, 747 di spam), dalla UCI
  Machine Learning Repository, con licenza Creative Commons Attribution
  4.0 International:
    https://archive.ics.uci.edu/dataset/228/sms+spam+collection
    https://doi.org/10.24432/C5CC84
  La pagina della raccolta:
    http://www.dt.fee.unicamp.br/~tiago/smsspamcollection/
  L'articolo da citare:
    T. A. Almeida, J. M. Gomez Hidalgo, A. Yamakami, "Contributions to the
    Study of SMS Spam Filtering: New Collection and Results", Proceedings
    of the 11th ACM Symposium on Document Engineering (DocEng 2011),
    pp. 259-262. https://doi.org/10.1145/2034691.2034742
  Le uniche modifiche al testo, in 42 messaggi: i trattini lunghi sono
  diventati "-" e le virgolette rimaste come caratteri di controllo di
  Windows-1252 sono tornate virgolette.

  NSL-KDD, file KDDTest+.txt (22.544 record), del Canadian Institute for
  Cybersecurity, University of New Brunswick:
    https://www.unb.ca/cic/datasets/nsl.html
  Il programma ne contiene protocollo, servizio, flag, etichetta e i byte
  inviati dalla sorgente (src_bytes). La licenza del dataset:
    "You may redistribute, republish, and mirror the ISCX NSL-KDD dataset in
    any form. However, any use or redistribution of the data must include a
    citation to the NSL-KDD dataset and the paper referenced below."
  L'articolo da citare:
    M. Tavallaee, E. Bagheri, W. Lu, A. Ghorbani, "A Detailed Analysis of
    the KDD CUP 99 Data Set", Second IEEE Symposium on Computational
    Intelligence for Security and Defense Applications (CISDA), 2009.
    https://ieeexplore.ieee.org/document/5356528

Contenuto
  index.html   la pagina
  style.css    lo stile
  homework7.js i dati, i calcoli, i grafici e la riga di comando
  app.js       l'interfaccia e i testi (italiano e inglese)
  README.txt   questo file


ENGLISH

Two parts, as in the assignment. The first explains the modes of
convergence of probability theory (in probability, almost sure, in mean
square, in distribution) with the counterexamples and the map of
implications; their role in the law of large numbers, in the central limit
theorem and in other results of statistics (consistency, Slutsky, the delta
method, Glivenko-Cantelli, the normality of the maximum likelihood
estimator); and why the square root of n appears: the variance that adds up
thanks to independence, alarms in bursts when independence is missing,
heavy tails and the speed of convergence. The second covers conditional
probability (the chain of an attack, conditional independence, the p-value
against P(H0 | data)), Bayes' theorem with prior, likelihood and posterior,
and its examples: the alarm of an IDS and the base rate, a Bayesian network
for triage, Wald's sequential test, the click rate of a phishing campaign
with different priors, the comparison with frequentist intervals, two naive
Bayes filters on real data (SMS and NSL-KDD), advantages, limitations and
influence of the prior, and the posterior that converges (Bernstein-von
Mises). Twelve "Try it" boxes let you get your hands on the numbers.

How to open it
  Extract the whole archive into a folder and double click index.html: it
  works offline too, without a server. It opens in English; IT / EN at the
  top changes the language. The long simulations run in slices while the
  page can already be read: the sections that need them fill in a few
  seconds.

From a terminal
  node homework7.js [--seed 2026 | --random-seed]
  prints, in the order of the page, the modes of convergence, the square
  root of n and the bursts, the other results of statistics, conditional
  probability, the alarm, the network, Wald's test, the campaign, the
  coverages, the two filters and the checks.

The data
  SMS Spam Collection v.1 (5,574 SMS in English, 747 of them spam), from
  the UCI Machine Learning Repository, under the Creative Commons
  Attribution 4.0 International license:
    https://archive.ics.uci.edu/dataset/228/sms+spam+collection
    https://doi.org/10.24432/C5CC84
  The page of the collection:
    http://www.dt.fee.unicamp.br/~tiago/smsspamcollection/
  The paper to cite:
    T. A. Almeida, J. M. Gomez Hidalgo, A. Yamakami, "Contributions to the
    Study of SMS Spam Filtering: New Collection and Results", Proceedings
    of the 11th ACM Symposium on Document Engineering (DocEng 2011),
    pp. 259-262. https://doi.org/10.1145/2034691.2034742
  The only changes to the text, in 42 messages: the long dashes became "-"
  and the quotation marks left as Windows-1252 control characters became
  quotation marks again.

  NSL-KDD, file KDDTest+.txt (22,544 records), from the Canadian Institute
  for Cybersecurity, University of New Brunswick:
    https://www.unb.ca/cic/datasets/nsl.html
  The program contains its protocol, service, flag, label and the bytes
  sent by the source (src_bytes). The license of the dataset:
    "You may redistribute, republish, and mirror the ISCX NSL-KDD dataset in
    any form. However, any use or redistribution of the data must include a
    citation to the NSL-KDD dataset and the paper referenced below."
  The paper to cite:
    M. Tavallaee, E. Bagheri, W. Lu, A. Ghorbani, "A Detailed Analysis of
    the KDD CUP 99 Data Set", Second IEEE Symposium on Computational
    Intelligence for Security and Defense Applications (CISDA), 2009.
    https://ieeexplore.ieee.org/document/5356528

Contents
  index.html   the page
  style.css    the style
  homework7.js data, computations, charts and command line
  app.js       interface and texts (Italian and English)
  README.txt   this file
