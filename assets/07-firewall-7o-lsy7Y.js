const e=`  _                _                              _                    _             ______
 | |              | |                            | |                  (_)           |____  |
 | |        __ _  | |__     ___    _ __    __ _  | |_    ___    _ __   _    ___         / /
 | |       / _\` | | '_ \\   / _ \\  | '__|  / _\` | | __|  / _ \\  | '__| | |  / _ \\       / /
 | |____  | (_| | | |_) | | (_) | | |    | (_| | | |_  | (_) | | |    | | | (_) |     / /
 |______|  \\__,_| |_.__/   \\___/  |_|     \\__,_|  \\__|  \\___/  |_|    |_|  \\___/     /_/



	-------------------------------------------------
	   Comprendere il funzionamento di un firewall
	-------------------------------------------------


	------------------------------------------------------
	    +++++ Teoria: Architettura netfilter/iptables +++++
	------------------------------------------------------

[Analisi a basso livello]
Netfilter e iptables: il framework di filtraggio dei pacchetti in Linux

Netfilter e' il framework integrato nel kernel Linux per l'intercettazione e la manipolazione
dei pacchetti di rete. Opera attraverso una serie di hook (punti di aggancio) inseriti nel
percorso di elaborazione dei pacchetti all'interno dello stack di rete del kernel. iptables
e' il tool in spazio utente (userspace) che consente all'amministratore di configurare le
regole di netfilter tramite l'interfaccia del socket netlink.

Le 5 chain (catene) principali corrispondono ai 5 hook di netfilter:

  1. PREROUTING (NF_INET_PRE_ROUTING): il pacchetto e' appena arrivato dall'interfaccia di
     rete, prima di qualsiasi decisione di routing. Qui si applicano le regole DNAT
     (Destination NAT) per modificare l'indirizzo di destinazione.

  2. INPUT (NF_INET_LOCAL_IN): il pacchetto e' destinato al sistema locale (dopo la decisione
     di routing). Qui si filtrano i pacchetti diretti ai servizi locali del firewall stesso.

  3. FORWARD (NF_INET_FORWARD): il pacchetto non e' destinato al sistema locale ma deve
     essere inoltrato verso un'altra rete (il sistema opera come router). Questa e' la chain
     fondamentale per un firewall che protegge una rete interna.

  4. OUTPUT (NF_INET_LOCAL_OUT): il pacchetto e' stato generato localmente dal sistema ed
     e' in uscita. Qui si filtrano i pacchetti originati dal firewall stesso.

  5. POSTROUTING (NF_INET_POST_ROUTING): il pacchetto sta per lasciare il sistema, dopo la
     decisione di routing. Qui si applicano le regole SNAT (Source NAT) e il masquerading.

Le tabelle organizzano le regole per funzionalita':

  - filter: tabella predefinita, utilizzata per il filtraggio dei pacchetti (ACCEPT, DROP,
    REJECT). Contiene le chain INPUT, FORWARD e OUTPUT.

  - nat: utilizzata per la traduzione degli indirizzi di rete (Network Address Translation).
    Contiene PREROUTING (DNAT), OUTPUT e POSTROUTING (SNAT/MASQUERADE).

  - mangle: utilizzata per la modifica degli header dei pacchetti (TTL, TOS, MARK).
    Contiene tutte e 5 le chain.

  - raw: utilizzata per le eccezioni al connection tracking (conntrack). I pacchetti marcati
    con NOTRACK non vengono tracciati dal modulo conntrack. Contiene PREROUTING e OUTPUT.

Percorso del pacchetto nel kernel Linux:

  Pacchetto in arrivo dall'interfaccia di rete
    -> raw PREROUTING -> conntrack -> mangle PREROUTING -> nat PREROUTING
    -> Decisione di routing
       |
       +-- Se destinato al sistema locale:
       |     -> mangle INPUT -> filter INPUT -> Processo locale
       |
       +-- Se da inoltrare (forwarding):
             -> mangle FORWARD -> filter FORWARD
             -> mangle POSTROUTING -> nat POSTROUTING
             -> Interfaccia di rete in uscita

  Per il routing tra ns2 e ns4 tramite ns3, i pacchetti attraversano la chain FORWARD di ns3,
  perche' ns3 opera come router (ip_forward=1) e i pacchetti non sono destinati a ns3 stesso
  ma devono essere inoltrati da un'interfaccia all'altra (da eth0 a eth1 o viceversa).

  Nota: il forwarding IP deve essere abilitato nel kernel tramite:
    echo 1 > /proc/sys/net/ipv4/ip_forward
  oppure tramite sysctl: net.ipv4.ip_forward = 1
  Senza questo parametro, il kernel scarta silenziosamente tutti i pacchetti non destinati al
  sistema locale, rendendo impossibile il funzionamento come router.
[/Analisi]


	-------------------------------------------------
	   Configurazione e test del firewall
	-------------------------------------------------

# Avviso: questa attivita' e' stata svolta usando la WSL "kali-linux" su un PC con sistema operativo Windows, a causa del fatto che FortiClient VPN non funziona sul mio computer con Kali Linux come sistema operativo nativo.
# Riprendiamo il laboratorio 4 "Routing" e il relativo compose file in cui ns3 svolge la funzione di router tra ns4 e ns2:

> wget http://didattica-linux.unipr.it/~roberto.alfieri@unipr.it/matdid/RETI/docker/Routing/compose.yml
--2024-11-26 16:08:11--  http://didattica-linux.unipr.it/~roberto.alfieri@unipr.it/matdid/RETI/docker/Routing/compose.yml
Resolving didattica-linux.unipr.it (didattica-linux.unipr.it)... 160.78.50.165
Connecting to didattica-linux.unipr.it (didattica-linux.unipr.it)|160.78.50.165|:80... connected.
HTTP request sent, awaiting response... 200 OK
Length: 802
Saving to: <<compose.yml>>

compose.yml                                         100%[=================================================================================================================>]     802  --.-KB/s    in 0s

2024-11-26 16:08:12 (84.4 MB/s) - <<compose.yml>> saved [802/802]


> docker-compose up -d
[+] Running 5/5
 ✔ Network bridge2  Created                                                                                                                                                                              0.1s
 ✔ Network bridge1  Created                                                                                                                                                                              0.1s
 ✔ Container ns4    Started                                                                                                                                                                              1.4s
 ✔ Container ns2    Started                                                                                                                                                                              1.3s
 ✔ Container ns3    Started																						 1.5s


> docker ps -a
CONTAINER ID   IMAGE                  COMMAND                  CREATED          STATUS          PORTS            NAMES
fcafa50b6bf4   cyberteam1/nginx-ssh   "/docker-entrypoint..."   54 seconds ago   Up 52 seconds   22/tcp, 80/tcp   ns3
5114064f14be   cyberteam1/nginx-ssh   "/docker-entrypoint..."   54 seconds ago   Up 52 seconds   22/tcp, 80/tcp   ns4
aa5921518b20   cyberteam1/nginx-ssh   "/docker-entrypoint..."   54 seconds ago   Up 52 seconds   22/tcp, 80/tcp   ns2

[Analisi a basso livello]
La topologia di rete creata dal compose.yml definisce due reti bridge Docker:

  - bridge1 (10.0.1.0/24): collega ns2 (10.0.1.2) e ns3 (10.0.1.3)
  - bridge2 (10.0.2.0/24): collega ns3 (10.0.2.3) e ns4 (10.0.2.4)

ns3 ha due interfacce di rete (eth0 su bridge1, eth1 su bridge2) e opera come router tra le
due sottoreti. Ogni rete bridge Docker corrisponde a un bridge virtuale Linux (creato con
brctl o ip link add type bridge) e a una coppia di interfacce veth (Virtual Ethernet) per
ogni container collegato.

Il flag privileged: true nel compose.yml disabilita l'isolamento dei Linux capabilities e
concede al container l'accesso completo a /proc e /sys. Questo e' necessario per poter
manipolare le regole iptables e le tabelle di routing all'interno del container.
[/Analisi]


# Eseguo alcune verifiche per assicurarmi che tutto sia configurato correttamente:
> more compose.yml
networks:
  bridge1:
    name: bridge1
    driver: bridge
    ipam:
      config:
        - subnet: 10.0.1.0/24
  bridge2:
    name: bridge2
    driver: bridge
    ipam:
      config:
        - subnet: 10.0.2.0/24

services:
  ns2:
    privileged: true
    container_name: ns2
    hostname: ns2
    image: cyberteam1/nginx-ssh
    networks:
      bridge1:
       ipv4_address: 10.0.1.2

  ns3:
    privileged: true
    container_name: ns3
    hostname: ns3
    image: cyberteam1/nginx-ssh
    networks:
      bridge1:
       ipv4_address: 10.0.1.3
      bridge2:
       ipv4_address: 10.0.2.3

  ns4:
    privileged: true
    container_name: ns4
    hostname: ns4
    image: cyberteam1/nginx-ssh
    networks:
      bridge2:
         ipv4_address: 10.0.2.4


> docker exec ns2 ip r
default via 10.0.1.1 dev eth0
10.0.1.0/24 dev eth0 proto kernel scope link src 10.0.1.2


> docker exec ns4 ip r del default


> docker exec ns4 ip r add default via 10.0.2.3


> docker exec ns4 ip r
default via 10.0.2.3 dev eth0
10.0.2.0/24 dev eth0 proto kernel scope link src 10.0.2.4


> docker exec ns2 ip r add 10.0.2.0/24 via 10.0.1.3


> docker exec ns2 ip r
default via 10.0.1.1 dev eth0
10.0.1.0/24 dev eth0 proto kernel scope link src 10.0.1.2
10.0.2.0/24 via 10.0.1.3 dev eth0

[Analisi a basso livello]
Configurazione delle tabelle di routing:

- ns4 ha come default gateway ns3 (10.0.2.3): tutti i pacchetti destinati al di fuori della
  rete 10.0.2.0/24 vengono inviati a ns3 per l'inoltro. La rotta "proto kernel scope link"
  e' stata creata automaticamente dal kernel quando l'interfaccia eth0 e' stata configurata
  con l'indirizzo 10.0.2.4/24 (rotta directly connected).

- ns2 ha una rotta statica 10.0.2.0/24 via 10.0.1.3: i pacchetti destinati alla rete di ns4
  vengono inviati a ns3 (che operando come router li inoltra verso bridge2). Senza questa
  rotta, ns2 invierebbe questi pacchetti al default gateway (10.0.1.1, il bridge Docker stesso),
  che non saprebbe come raggiungere la rete 10.0.2.0/24.

- Il comando "ip r del default" seguito da "ip r add default via 10.0.2.3" su ns4 e' necessario
  perche' Docker imposta come default gateway l'indirizzo del bridge (10.0.2.1), che non ha una
  rotta verso 10.0.1.0/24. Sostituendo il gateway con ns3, tutti i pacchetti di ns4 vengono
  correttamente instradati tramite il router.
[/Analisi]



# Tutto sembra essere corretto, ora iniziamo con l'esercitazione vera e propria.
# Configuriamo il firewall "iptables" di ns3 in modo che i pacchetti tra ns2 e ns4 vengano filtrati in base a opportune politiche di sicurezza:


> docker exec ns3 iptables -nvL
# Warning: iptables-legacy tables present, use iptables-legacy to see them
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination

Chain FORWARD (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination

Chain OUTPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination

[Analisi a basso livello]
Il comando "iptables -nvL" visualizza le regole della tabella filter (predefinita):
  - -n: mostra gli indirizzi IP in formato numerico (evita la risoluzione DNS inversa, che
    rallenterebbe l'output e potrebbe generare traffico di rete indesiderato)
  - -v: modalita' verbose, mostra i contatori dei pacchetti (pkts) e dei byte (bytes) per
    ogni regola, utili per il debug e il monitoraggio
  - -L: elenca tutte le regole di tutte le chain

Allo stato iniziale, tutte e tre le chain (INPUT, FORWARD, OUTPUT) hanno policy ACCEPT e
nessuna regola: tutto il traffico e' permesso senza alcun filtraggio. Questo corrisponde
a un firewall completamente aperto.

Il warning "iptables-legacy tables present" indica che il sistema ha due backend per
netfilter: iptables-legacy (basato su x_tables) e iptables-nft (basato su nftables).
Il comando iptables potrebbe essere un alias per uno dei due.
[/Analisi]


# Eliminare (Flush) tutte le regole eventualmente presenti
> docker exec ns3 iptables -F

[Analisi a basso livello]
Il comando "iptables -F" (Flush) rimuove tutte le regole da tutte le chain della tabella
filter. Internamente, comunica con il modulo netfilter del kernel tramite un socket netlink
per svuotare le liste concatenate che contengono le regole.

ATTENZIONE CRITICA: il flush NON modifica la policy di default delle chain. Se la policy
fosse gia' impostata a DROP e si eseguisse un flush, il risultato sarebbe il blocco totale
del traffico (tutte le regole ACCEPT vengono rimosse, ma la policy DROP rimane attiva).
Questa e' una causa comune di lock-out accidentale da server remoti.
[/Analisi]


# Ammessi tutti i pacchetti uscenti (da eth1 a eth0)
> docker exec ns3 iptables -A FORWARD -i eth1 -o eth0 -j ACCEPT

[Analisi a basso livello]
Questa regola accetta tutti i pacchetti che entrano dall'interfaccia eth1 (collegata a
bridge2, rete 10.0.2.0/24 dove si trova ns4) e escono dall'interfaccia eth0 (collegata
a bridge1, rete 10.0.1.0/24 dove si trova ns2).

Dettaglio dei parametri:
  - -A FORWARD: Append, aggiunge la regola in coda alla chain FORWARD
  - -i eth1: match sull'interfaccia di ingresso (campo meta del pacchetto nel kernel)
  - -o eth0: match sull'interfaccia di uscita (determinata dopo la decisione di routing)
  - -j ACCEPT: target ACCEPT, il pacchetto viene accettato e prosegue nel percorso di rete

Significato pratico: ns4 (sulla rete 10.0.2.0/24) puo' raggiungere ns2 (sulla rete
10.0.1.0/24) senza alcuna restrizione. Qualsiasi protocollo e qualsiasi porta sono permessi
in questa direzione. Questo consente a ns4 di iniziare connessioni verso ns2 liberamente.

Nota: questa regola copre solo il traffico da eth1 a eth0 (da ns4 verso ns2). Il traffico
nella direzione opposta (da ns2 verso ns4, cioe' da eth0 a eth1) NON e' coperto da questa
regola e sara' soggetto alle regole successive o alla policy di default.
[/Analisi]


# Ammessi tutti i pacchetti relativi a connessioni attive (stato ESTABLISHED)
> docker exec ns3 iptables --append FORWARD -p ALL -m state --state ESTABLISHED -j ACCEPT

[Analisi a basso livello]
Questa regola utilizza il modulo conntrack (connection tracking) del kernel Linux per
tracciare lo stato delle connessioni di rete.

Dettaglio dei parametri:
  - --append FORWARD: aggiunge la regola alla chain FORWARD (forma estesa di -A)
  - -p ALL: corrisponde a qualsiasi protocollo (TCP, UDP, ICMP, ecc.)
  - -m state --state ESTABLISHED: carica il modulo di match "state" e verifica che il
    pacchetto appartenga a una connessione gia' stabilita

Il modulo conntrack mantiene una tabella in memoria kernel (/proc/net/nf_conntrack) che
registra ogni connessione vista. Gli stati possibili sono:
  - NEW: primo pacchetto di una nuova connessione (es. SYN TCP)
  - ESTABLISHED: il kernel ha visto pacchetti in entrambe le direzioni (es. dopo SYN + SYN-ACK).
    Per TCP, lo stato ESTABLISHED viene impostato dopo che il kernel ha visto il SYN-ACK di
    risposta. Per UDP (protocollo stateless), il kernel lo considera ESTABLISHED dopo aver
    visto un pacchetto di risposta dalla destinazione.
  - RELATED: il pacchetto e' correlato a una connessione esistente (es. ICMP error in risposta
    a una connessione TCP, o connessione dati FTP correlata alla connessione di controllo)
  - INVALID: il pacchetto non appartiene a nessuna connessione nota e non e' un valido primo
    pacchetto di una nuova connessione

Significato pratico: questa regola permette ai pacchetti di risposta di attraversare il
firewall anche quando la policy di default e' DROP. Se ns2 ha stabilito una connessione
SSH con ns4, i pacchetti di risposta da ns4 verso ns2 matchano questa regola perche' il
kernel ha gia' registrato la connessione. Senza questa regola, anche le connessioni
esplicitamente permesse non funzionerebbero, perche' i pacchetti di ritorno verrebbero
bloccati.
[/Analisi]


# Ammesse le nuove connessioni verso ns4 sulla porta 22
> docker exec ns3 iptables --append FORWARD --proto tcp --dport 22 -d 10.0.2.4 -j ACCEPT

[Analisi a basso livello]
Questa regola permette NUOVE connessioni TCP verso la porta 22 (SSH) dell'host ns4
(10.0.2.4).

Dettaglio dei parametri:
  - --proto tcp: corrisponde solo ai pacchetti del protocollo TCP (protocol number 6
    nell'header IP)
  - --dport 22: corrisponde ai pacchetti con porta di destinazione 22 (campo Destination
    Port nell'header TCP). La porta 22 e' la porta standard del protocollo SSH
  - -d 10.0.2.4: corrisponde ai pacchetti con indirizzo IP di destinazione 10.0.2.4 (ns4)
  - -j ACCEPT: il pacchetto viene accettato

Flusso di una connessione SSH attraverso il firewall:
  1. Il client (ns2) invia un pacchetto SYN verso 10.0.2.4:22
     -> Questo SYN matcha la regola --dport 22 (connessione NEW) -> ACCEPT
  2. ns4 risponde con SYN-ACK
     -> Il conntrack ha gia' registrato la connessione, il SYN-ACK matcha la regola
        ESTABLISHED -> ACCEPT
  3. Tutti i pacchetti successivi (dati SSH, ACK, ecc.) della stessa connessione
     -> Matchano la regola ESTABLISHED -> ACCEPT

Solo il primo pacchetto SYN ha bisogno della regola specifica sulla porta 22; tutti i
pacchetti successivi della stessa connessione sono gestiti dalla regola ESTABLISHED. Questo
e' il pattern tipico di un firewall stateful.
[/Analisi]


# Tutto il resto (default policy) e' bloccato
> docker exec ns3 iptables --policy FORWARD  DROP

[Analisi a basso livello]
Il comando imposta la policy di default della chain FORWARD a DROP.

DROP vs REJECT:
  - DROP: il pacchetto viene silenziosamente scartato dal kernel (la funzione kfree_skb()
    libera il socket buffer). Nessuna risposta viene inviata al mittente. Il client rimane
    in attesa fino al timeout del protocollo.
  - REJECT: il pacchetto viene scartato e il kernel invia una risposta ICMP "Destination
    Unreachable" o un RST TCP. Il client riceve immediatamente la notifica del rifiuto.

La scelta di DROP implementa il principio del "default deny" (nega tutto cio' che non e'
esplicitamente permesso), che e' una best practice fondamentale nella sicurezza informatica.
Qualsiasi pacchetto che attraversa la chain FORWARD senza essere stato accettato da una
regola viene silenziosamente scartato.

L'uso di DROP anziche' REJECT rende il firewall "stealth": dal punto di vista di un
attaccante esterno, e' impossibile distinguere tra una porta filtrata e un host inesistente,
poiche' in entrambi i casi non si riceve alcuna risposta. Questo complica le attivita' di
ricognizione (port scanning).

L'ordine finale delle regole nella chain FORWARD e' cruciale. iptables valuta le regole
in ordine sequenziale (dall'alto verso il basso) e applica la prima regola che corrisponde
al pacchetto. Le regole piu' specifiche dovrebbero precedere quelle piu' generiche.
L'ordine attuale e':
  1. ACCEPT da eth1 a eth0 (ns4 -> ns2, qualsiasi traffico)
  2. ACCEPT ESTABLISHED (pacchetti di ritorno di connessioni gia' stabilite)
  3. ACCEPT TCP dport 22 verso 10.0.2.4 (nuove connessioni SSH verso ns4)
  4. Policy DROP (tutto il resto viene scartato)
[/Analisi]


# Lista delle regole iptables di ns3
> docker exec ns3 iptables -nvL
# Warning: iptables-legacy tables present, use iptables-legacy to see them
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination

Chain FORWARD (policy DROP 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 ACCEPT     all  --  eth1   eth0    0.0.0.0/0            0.0.0.0/0
    0     0 ACCEPT     all  --  *      *       0.0.0.0/0            0.0.0.0/0            state ESTABLISHED
    0     0 ACCEPT     tcp  --  *      *       0.0.0.0/0            10.0.2.4             tcp dpt:22

Chain OUTPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination


	------------------------------------------------------
	    +++++ Verifiche del firewall +++++
	------------------------------------------------------

# Verifica: da ns2 a ns4 SSH funziona correttamente (porta 22 permessa)
> docker exec -it  ns2 ssh ubuntu@10.0.2.4
The authenticity of host '10.0.2.4 (10.0.2.4)' can't be established.
ED25519 key fingerprint is SHA256:LB3Ms/DT4dEpcYsnq3DdXfojqT08VDApPMh1fdmSV90.
This key is not known by any other names
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '10.0.2.4' (ED25519) to the list of known hosts.
ubuntu@10.0.2.4's password:
Welcome to Ubuntu 23.04 (GNU/Linux 5.15.153.1-microsoft-standard-WSL2 x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

This system has been minimized by removing packages and content that are
not required on a system that users do not log into.

To restore this content, you can run the 'unminimize' command.

The programs included with the Ubuntu system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Ubuntu comes with ABSOLUTELY NO WARRANTY, to the extent permitted by
applicable law.

ubuntu@ns4:~$ exit
logout
Connection to 10.0.2.4 closed.

[Analisi a basso livello]
La connessione SSH ha avuto successo. Ecco il percorso completo dei pacchetti:

1. ns2 invia un pacchetto SYN (TCP, flag SYN=1) con destinazione 10.0.2.4:22.
   Il pacchetto arriva su ns3 tramite eth0 (bridge1).
   -> Routing decision: destinazione 10.0.2.4 -> instradamento verso eth1 (bridge2)
   -> Chain FORWARD: regola 1 (eth1->eth0) non matcha (il pacchetto va da eth0 a eth1)
   -> Regola 2 (ESTABLISHED) non matcha (connessione NEW, il conntrack non ha ancora visto
      pacchetti di risposta)
   -> Regola 3 (TCP dport 22 verso 10.0.2.4) MATCHA -> ACCEPT
   Il SYN viene inoltrato a ns4.

2. ns4 risponde con SYN-ACK (TCP, flag SYN=1, ACK=1) verso ns2.
   Il pacchetto arriva su ns3 tramite eth1 (bridge2).
   -> Chain FORWARD: regola 1 (eth1->eth0) MATCHA -> ACCEPT
   (Nota: anche la regola 2 ESTABLISHED avrebbe matchato, poiche' il conntrack ha ora
   registrato la connessione dopo aver visto SYN e SYN-ACK. Ma la regola 1 viene valutata
   per prima.)

3. ns2 completa il three-way handshake con ACK -> FORWARD -> regola 3 o ESTABLISHED -> ACCEPT
4. I dati SSH (cifrati con l'algoritmo negoziato durante il key exchange) fluiscono in
   entrambe le direzioni, tutti accettati dalla regola ESTABLISHED o dalla regola eth1->eth0.

La verifica del fingerprint ED25519 protegge contro attacchi Man-in-the-Middle (MITM): il
client verifica che la chiave pubblica del server corrisponda a quella attesa.
[/Analisi]


# Verifica: da ns2 a ns4 HTTP non funziona (porta 80 non permessa)
> docker exec ns2 curl http://10.0.2.4/
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:--  0:00:03 --:--:--     0^Ccontext canceled

[Analisi a basso livello]
La connessione HTTP e' fallita. Ecco cosa succede a livello di pacchetti:

1. ns2 invia un pacchetto SYN (TCP) con destinazione 10.0.2.4:80.
   Il pacchetto arriva su ns3 tramite eth0.
   -> Chain FORWARD: regola 1 (eth1->eth0) non matcha (direzione sbagliata: eth0->eth1)
   -> Regola 2 (ESTABLISHED) non matcha (connessione NEW)
   -> Regola 3 (TCP dport 22) non matcha (la porta di destinazione e' 80, non 22)
   -> Nessuna regola corrisponde -> si applica la policy DROP
   Il pacchetto SYN viene silenziosamente scartato.

2. ns2 non riceve risposta. Lo stack TCP del client attende il timeout di ritrasmissione
   (RTO, Retransmission Timeout, tipicamente 1 secondo iniziale, poi raddoppia: 1s, 2s, 4s,
   8s...) e ritrasmette il SYN. Ogni ritrasmissione viene ugualmente droppata da ns3.

3. Dopo il timeout massimo (tipicamente 6 tentativi, circa 63 secondi totali), lo stack TCP
   restituisce un errore ETIMEDOUT all'applicazione curl.

4. L'output "^Ccontext canceled" indica che l'utente ha premuto Ctrl+C prima del timeout
   completo, interrompendo manualmente curl dopo 3 secondi di attesa.

Dal punto di vista della sicurezza: l'uso di DROP (anziche' REJECT) significa che il client
non riceve alcuna risposta. Un attaccante che esegue un port scanning non puo' distinguere
tra una porta filtrata da un firewall e un host inesistente, perche' in entrambi i casi
non arriva alcuna risposta (stealth filtering). Se si usasse REJECT, il firewall invierebbe
un pacchetto ICMP "port unreachable" o un TCP RST, rivelando la propria esistenza.
[/Analisi]


# Verifica: da ns4, HTTP verso se stesso funziona (traffico locale, non attraversa il firewall)
> docker exec ns4 curl http://10.0.2.4/
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   615  100   615    0     0   246k      0 --:--:-- --:--:-- --:--:--  300k
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
html { color-scheme: light dark; }
body { width: 35em; margin: 0 auto;
font-family: Tahoma, Verdana, Arial, sans-serif; }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>

<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>

> docker exec ns4 curl http://10.0.1.2/
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   615  100   615    0     0   241k      0 --:--:-- --:--:-- --:--:--  300k
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
html { color-scheme: light dark; }
body { width: 35em; margin: 0 auto;
font-family: Tahoma, Verdana, Arial, sans-serif; }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>

<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>

[Analisi a basso livello]
Questi due test dimostrano due situazioni diverse:

1. ns4 verso se stesso (10.0.2.4): il traffico e' locale. Il pacchetto viene instradato
   tramite l'interfaccia di loopback (lo) e non attraversa mai il firewall di ns3.
   Percorso nel kernel: OUTPUT -> routing (destinazione locale) -> INPUT. La chain FORWARD
   non viene mai coinvolta. Per questo la risposta arriva istantaneamente.

2. ns4 verso ns2 (10.0.1.2): il traffico attraversa ns3 (FORWARD), ma nella direzione
   permessa dalla regola 1 (eth1->eth0). Il SYN di ns4 entra su ns3 da eth1 e esce da eth0
   -> regola 1 ACCEPT. Il SYN-ACK di ns2 matcha la regola ESTABLISHED. Tutto il traffico
   HTTP fluisce correttamente perche' ns4 puo' iniziare qualsiasi connessione verso ns2
   senza restrizioni.

Questo evidenzia l'asimmetria del firewall: ns4 puo' raggiungere ns2 su qualsiasi porta
(regola eth1->eth0), ma ns2 puo' raggiungere ns4 solo sulla porta 22 (SSH).
[/Analisi]


# Attiviamo su ns3 la regola per HTTP
> docker exec ns3 iptables --append FORWARD --proto tcp --dport 80 -d 10.0.2.4 -j ACCEPT

[Analisi a basso livello]
Questa regola e' analoga alla regola per la porta 22, ma per la porta 80 (HTTP).
Viene aggiunta in coda alla chain FORWARD (--append), quindi l'ordine diventa:
  1. ACCEPT eth1->eth0 (ns4 -> ns2, qualsiasi traffico)
  2. ACCEPT ESTABLISHED (pacchetti di ritorno)
  3. ACCEPT TCP dport 22 verso 10.0.2.4 (SSH)
  4. ACCEPT TCP dport 80 verso 10.0.2.4 (HTTP) <-- NUOVA
  5. Policy DROP (tutto il resto)

Ora il SYN TCP del client verso la porta 80 di ns4 matcha la regola 4 e viene accettato.
I pacchetti successivi della connessione HTTP (richieste GET, risposte con il contenuto HTML,
ACK) matchano la regola 2 (ESTABLISHED).

L'ordine delle regole e' fondamentale: iptables le valuta sequenzialmente e applica la prima
regola che corrisponde. Le regole piu' specifiche dovrebbero precedere quelle piu' generiche.
Se la policy DROP fosse stata inserita come regola esplicita prima delle regole ACCEPT,
nessun traffico sarebbe mai stato accettato. Per questo le regole ACCEPT vanno inserite
PRIMA di impostare la policy a DROP (o prima di una regola DROP esplicita).
[/Analisi]


> docker exec ns3 iptables -nvL
# Warning: iptables-legacy tables present, use iptables-legacy to see them
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination

Chain FORWARD (policy DROP 14 packets, 840 bytes)
 pkts bytes target     prot opt in     out     source               destination
  214 36267 ACCEPT     all  --  eth1   eth0    0.0.0.0/0            0.0.0.0/0
  232 35591 ACCEPT     all  --  *      *       0.0.0.0/0            0.0.0.0/0            state ESTABLISHED
    2   120 ACCEPT     tcp  --  *      *       0.0.0.0/0            10.0.2.4             tcp dpt:22
    1    60 ACCEPT     tcp  --  *      *       0.0.0.0/0            10.0.2.4             tcp dpt:80

Chain OUTPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination

[Analisi a basso livello]
Analisi dei contatori nel listing delle regole:

- Policy DROP: "14 packets, 840 bytes" -> 14 pacchetti sono stati scartati dalla policy DROP.
  Questi sono i pacchetti SYN TCP verso la porta 80 (e le relative ritrasmissioni) che sono
  stati inviati prima dell'aggiunta della regola --dport 80. Con 14 pacchetti da 60 byte
  ciascuno: 14 * 60 = 840 byte. I 60 byte corrispondono a un pacchetto SYN TCP tipico:
  20 byte header IP + 20 byte header TCP + opzioni TCP (timestamps, MSS, ecc.).

- Regola eth1->eth0: "214 pkts, 36267 bytes" -> traffico di ns4 verso ns2, comprende i
  pacchetti dati SSH e le risposte HTTP di ns4 quando contattato da se stesso attraverso ns3.

- Regola ESTABLISHED: "232 pkts, 35591 bytes" -> pacchetti di ritorno delle connessioni
  stabilite (ACK, dati di risposta, ecc.) nelle direzioni non coperte dalla regola eth1->eth0.

- Regola dport 22: "2 pkts, 120 bytes" -> 2 pacchetti SYN verso la porta SSH (probabilmente
  una connessione SSH stabilita: il SYN iniziale da 60 byte, e potenzialmente un secondo
  tentativo o connessione). 2 * 60 = 120 byte.

- Regola dport 80: "1 pkt, 60 bytes" -> 1 pacchetto SYN verso la porta HTTP. Indica che
  e' stata aperta una sola connessione HTTP dopo l'aggiunta della regola.
[/Analisi]


# Verifica: da ns2 a ns4 HTTP ora funziona correttamente
docker exec ns2 curl http://10.0.2.4/
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
html { color-scheme: light dark; }
body { width: 35em; margin: 0 auto;
font-family: Tahoma, Verdana, Arial, sans-serif; }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>

<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   615  100   615    0     0   597k      0 --:--:-- --:--:-- --:--:--  600k

[Analisi a basso livello]
La connessione HTTP e' ora riuscita. Il flusso completo dei pacchetti:

1. ns2 -> SYN verso 10.0.2.4:80 -> ns3 FORWARD -> regola 4 (dport 80) ACCEPT -> ns4
2. ns4 -> SYN-ACK verso ns2 -> ns3 FORWARD -> regola 1 (eth1->eth0) ACCEPT -> ns2
3. ns2 -> ACK (completa il three-way handshake) -> regola 3 o ESTABLISHED -> ns4
4. ns2 -> GET / HTTP/1.1 -> regola ESTABLISHED -> ns4
5. ns4 -> HTTP/1.1 200 OK + contenuto HTML (615 byte) -> regola 1 (eth1->eth0) -> ns2
6. Chiusura connessione: FIN/ACK in entrambe le direzioni -> ESTABLISHED

La velocita' di 600k (circa 600 KB/s misurata da curl) e' elevata perche' il traffico
transita interamente su interfacce virtuali Docker (veth), senza attraversare una rete
fisica reale. La latenza e' nell'ordine dei microsecondi.
[/Analisi]


> docker-compose down
[+] Running 5/5
 ✔ Container ns3    Removed                                                                                                                                                                              1.2s
 ✔ Container ns2    Removed                                                                                                                                                                              0.7s
 ✔ Container ns4    Removed                                                                                                                                                                              0.8s
 ✔ Network bridge2  Removed                                                                                                                                                                              0.3s
 ✔ Network bridge1  Removed																						 0.5s
`;export{e as default};
