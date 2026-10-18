const e=`@banner
  _                _                              _                    _                           __
 | |              | |                            | |                  (_)                         /_ |
 | |        __ _  | |__     ___    _ __    __ _  | |_    ___    _ __   _    ___                    | |
 | |       / _\` | | '_ \\   / _ \\  | '__|  / _\` | | __|  / _ \\  | '__| | |  / _ \\                   | |
 | |____  | (_| | | |_) | | (_) | | |    | (_| | | |_  | (_) | | |    | | | (_) |                  | |
 |______|  \\__,_| |_.__/   \\___/  |_|     \\__,_|  \\__|  \\___/  |_|    |_|  \\___/                   |_|
@end

@author Arcari Nicholas (matricola:xxxxxx)

Usando un sistema operativo quale kali-linux mi sono trovato in un ambiente a mio avviso "facilitato".

A differenza di molti miei colleghi universitari non mi e' servito installare ulteriori applicativi esterni;
bensi' ho unicamente operato da terminale.
Questo mi ha permesso di iniziare subito a cimentarmi con i comandi spiegatimi a lezione dal professore Alfieri Roberto.

## Installazione di Docker client e server

Ho avviato il demone usando il comando da terminale \`service docker start\`, il quale mi ha chiesto la password del computer.
Successivamente, ho controllato lo status del docker con il comando \`service docker status\`.
Mi e' stato confermato il corretto funzionamento del bridge, del demone, dello storage del computer, ecc...

Successivamente, ho eseguito il comando \`docker version\` il quale mi ha stampato a schermo la seguente schermata:

@term
| Client:
|  Version:           20.10.25+dfsg1
|  API version:       1.41
|  Go version:        go1.22.3
|  Git commit:        b82b9f3
|  Built:             Tue May  7 10:33:18 2024
|  OS/Arch:           linux/amd64
|  Context:           default
|  Experimental:      true
|
| Server:
|  Engine:
|   Version:          20.10.25+dfsg1
|   API version:      1.41 (minimum version 1.12)
|   Go version:       go1.22.3
|   Git commit:       5df983c
|   Built:            Tue May  7 10:33:18 2024
|   OS/Arch:          linux/amd64
|   Experimental:     false
|  containerd:
|   Version:          1.6.24~ds1
|   GitCommit:        1.6.24~ds1-2
|  runc:
|   Version:          1.1.12+ds1
|   GitCommit:        1.1.12+ds1-5+b1
|  docker-init:
|   Version:          0.19.0
|   GitCommit:
@end

@analysis
L'output di \`docker version\` rivela l'architettura interna di Docker, composta da diversi
componenti che cooperano tra loro:

  - dockerd (Docker Engine): e' il demone principale che espone le API REST (versione 1.41).
    Quando si esegue \`service docker start\`, systemd avvia il processo dockerd che si mette in
    ascolto sul socket UNIX /var/run/docker.sock. Il client CLI comunica con il demone
    attraverso questo socket.

  - containerd: e' il runtime di alto livello (versione 1.6.24). dockerd delega a containerd la
    gestione del ciclo di vita dei container (creazione, avvio, arresto, eliminazione). containerd
    a sua volta utilizza runc per le operazioni di basso livello.

  - runc: e' il runtime OCI (Open Container Initiative) di basso livello (versione 1.1.12). E'
    il componente che effettivamente crea i container interagendo con il kernel Linux. runc
    configura i Linux Namespaces e i cgroups necessari per l'isolamento.

  - docker-init (tini): e' un processo init minimale (versione 0.19.0) che viene usato come
    PID 1 all'interno del container quando si usa il flag --init. Il suo ruolo e' raccogliere
    i processi zombie (reaping) e propagare i segnali ai processi figli.

L'architettura Docker si basa su primitive fondamentali del kernel Linux:

  1) Linux Namespaces - forniscono l'isolamento delle risorse:
     - PID namespace: isola l'albero dei processi. Il primo processo nel container vede se' stesso
       come PID 1, ma sull'host ha un PID diverso. Questo impedisce ai processi nel container
       di vedere o inviare segnali ai processi dell'host.
     - NET namespace: isola lo stack di rete. Ogni container ha la propria interfaccia di rete
       (eth0), la propria tabella di routing, le proprie regole iptables e il proprio stack
       TCP/IP. Il container vede solo la sua rete virtuale.
     - MNT namespace: isola il filesystem. Il container ha la propria root (/) e non puo' accedere
       al filesystem dell'host se non attraverso volumi esplicitamente montati.
     - UTS namespace: isola hostname e domainname. Ogni container puo' avere un hostname diverso
       (impostato con --hostname), senza influenzare l'host.
     - IPC namespace: isola le risorse IPC (Inter-Process Communication) come code di messaggi
       System V, semafori e memoria condivisa. I processi di container diversi non possono
       comunicare tramite IPC.
     - USER namespace: mappa gli UID/GID del container su UID/GID diversi sull'host. Questo
       permette al processo root (UID 0) nel container di essere mappato su un utente non
       privilegiato sull'host, migliorando la sicurezza.

  2) Control Groups (cgroups) - limitano e contabilizzano le risorse:
     - Limitano l'uso di CPU, memoria RAM, I/O disco e banda di rete per ogni container.
     - Prevengono che un singolo container monopolizzi le risorse dell'host (es: un fork bomb
       nel container non puo' esaurire tutta la memoria dell'host se il cgroup ha un limite).
     - Le informazioni sui cgroups sono visibili in /sys/fs/cgroup/ sull'host.

  3) OverlayFS (Overlay Filesystem) - gestisce i layer delle immagini:
     - Ogni immagine Docker e' composta da una serie di layer in sola lettura, ciascuno
       rappresentante un'istruzione del Dockerfile.
     - Quando si avvia un container, Docker aggiunge un layer scrivibile (read-write layer) sopra
       i layer dell'immagine. Questo meccanismo si chiama Copy-on-Write (CoW): un file viene
       copiato nel layer superiore solo quando viene modificato.
     - OverlayFS unisce i layer tramite le directory lowerdir (read-only), upperdir (read-write)
       e merged (vista unificata). Questo rende l'avvio dei container molto rapido perche' non
       serve copiare l'intera immagine.

  4) Docker bridge network (docker0):
     - Docker crea un Linux bridge virtuale chiamato docker0 usando il modulo kernel bridge.
     - Per ogni container, Docker crea una coppia di interfacce virtuali (veth pair): una
       estremita' (eth0) viene inserita nel NET namespace del container, l'altra (vethXXXX)
       viene collegata al bridge docker0 nel namespace dell'host.
     - Il bridge docker0 funge da switch virtuale Layer 2: tutti i container collegati allo
       stesso bridge possono comunicare tra loro a livello Ethernet.
     - Docker configura regole iptables nella chain FORWARD per gestire il traffico tra
       container e tra container e il mondo esterno (tramite NAT/masquerade).
@end

## Gestione delle Immagini

@cmds
docker images			--->> mi si e' mostrata a schermo la lista delle immagini presenti/installate nel local registry (attualmente vuoto)
docker search ubuntu/nginx	--->> ho eseguito una ricerca nel Docker Hub delle immagini relative al campo di ricerca "ubuntu/nginx".
docker pull ubuntu/nginx	--->> come dice il termine "pull", ho copiato l'immagine "ubuntu/nginx" dal Docker Hub al local registry del mio computer.
docker inspect ubuntu/nginx	--->> ho potuto constatare le informazioni (codice) sul contenuto dell'immagine "ubuntu/nginx".
docker image rm ubuntu/nginx	--->> eventualmente avrei potuto rimuovere dal local registry l'immagine "ubuntu/nginx".
docker image prune		--->> eventualmente avrei potuto rimuovere tutte le immagini inutilizzate nei vari docker.
@end

## Gestione dei Container

Il modo piu' semplice per scaricare l'immagine, creare ed eseguire un container e' attraverso il comando "run":

@cmds
docker run -d --name ng1 ubuntu/nginx	--->> ho creato, usando l'immagine "ubuntu/nginx" il container di nome "ng1" (il comando -d e' per identificare la modalita' detached).
docker ps				--->> e' possibile visionare a schermo l'elenco dei container attivi.
@end

Maggiori informazioni le si hanno nel caso si selezioni il comando \`docker ps -a\` il quale mostra a schermo l'elenco di tutti i container con il loro eventuale status (running, exited, paused).
Grazie a questi due ultimi comandi e' stato facile notare come ogni container avesse un nome, un comando in esecuzione (entrypoint) e un identificativo (ID).
A seguito un esempio:

@term
| CONTAINER ID   IMAGE                  COMMAND                  CREATED        STATUS                    PORTS     NAMES
| e05387a895f5   nginx-ssh              "/docker-entrypoint..."   25 hours ago   Exited (0) 25 hours ago             ns3
| 0e20583cc601   nginx-ssh              "/docker-entrypoint..."   25 hours ago   Exited (0) 18 hours ago             ns2
| ff8ca39f8d5e   cyberteam1/nginx-ssh   "/docker-entrypoint..."   2 days ago     Exited (0) 18 hours ago             ng1
@end

Altri comandi utili alla comprensione di come usare in maniera comoda ed efficace i container sono \`docker stop ng1\` e \`docker start ng1\`, i quali, rispettivamente, fermano e riavviano il container.

Ora entriamo leggermente piu' all'interno dei container mediante l'uso di comandi quali:

@cmds
docker exec ng1 ps -ef			--->> esegue un solo comando nel container in esecuzione (in questo caso il comando e': ps -ef)
docker exec -it ng1 bash		--->> apre una shell interattiva nel container in esecuzione
@end

Eventualmente possiamo rimuovere tutti i container (tranne quelli in stato running) con il comando \`docker rm $(sudo docker ps -aq)\`.
Oppure possiamo stampare i log di un container con il comando \`docker logs nome_container\`

@analysis
- Il flag -d (detached mode): quando si avvia un container con \`docker run -d\`, il container
  viene eseguito come processo in background. Lo stdin del container non e' collegato al
  terminale dell'utente e l'output (stdout/stderr) viene catturato dal logging driver di Docker
  (di default json-file, che salva i log in /var/lib/docker/containers/<id>/<id>-json.log).
  Senza il flag -d, il container gira in foreground e il suo stdout/stderr e' collegato
  direttamente al terminale.

- Entrypoint vs CMD: nel Dockerfile si possono definire due direttive per specificare il
  processo da eseguire all'avvio del container:
    * ENTRYPOINT: definisce il comando principale del container. E' il processo che diventa
      PID 1 nel PID namespace del container. Se ENTRYPOINT usa la forma exec (es:
      ENTRYPOINT ["/docker-entrypoint.sh"]), il processo sostituisce la shell e riceve
      direttamente i segnali (SIGTERM, SIGKILL, ecc.).
    * CMD: fornisce gli argomenti di default per l'ENTRYPOINT. Se ENTRYPOINT non e' definito,
      CMD diventa il comando principale.
    * Nell'output di \`docker ps\` si vede la colonna COMMAND che mostra "/docker-entrypoint..." - questo e' l'ENTRYPOINT dell'immagine nginx che configura il server e poi avvia nginx
      come PID 1.

- docker exec e i namespace: quando si esegue \`docker exec -it ng1 bash\`, Docker utilizza
  internamente la syscall setns() (o l'utility nsenter) per inserire il nuovo processo
  (bash) in tutti i namespace del container gia' in esecuzione (PID, NET, MNT, UTS, IPC).
  Il flag -i (interactive) mantiene aperto lo stdin, il flag -t alloca un pseudo-terminale
  (PTY). Il processo creato da exec non e' PID 1 nel container, ma un processo aggiuntivo
  che condivide lo stesso ambiente isolato.
@end

## Creare Immagine nginx-ssh da container

Ipotizziamo di voler arricchire il container, possiamo farlo usando comandi di rete e servizio ssh, mediante i quali creeremo una nuova immagine che chiameremo "nginx-ssh"

Impostiamo il container come segue:

@term
$ docker run -d --name ng1 --hostname ng1 ubuntu/nginx
$ docker exec -it ng1 bash
$ ng1> apt update -y
$ ng1> apt install net-tools nmap traceroute iptables curl -y
$ ng1> apt install openssh-server nano iputils-ping dnsutils -y
$ ng1> mkdir /var/run/sshd; chmod 0755 /var/run/sshd; sshd -d&
$ ng1> sed -i '2i sshd -d&' /docker-entrypoint.sh
@end

@term
$ ng1> echo -n 'ubuntu:ubuntu' | chpasswd			<<---- ora la password di ubuntu e': "ubuntu"
$ ng1> ssh ubuntu@localhost
@end

Quest'ultimo comando ci permette di verificare se il server ssh sta funzionando correttamente, nel caso di risposta affermativa verra' mostrato a video quanto segue:

@term
| Environment:
|   USER=ubuntu
|   LOGNAME=ubuntu
|   HOME=/home/ubuntu
|   PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin
|   SHELL=/bin/bash
|   TZ=UTC
|   TERM=xterm
|   SSH_CLIENT=127.0.0.1 56348 22
|   SSH_CONNECTION=127.0.0.1 56348 127.0.0.1 22
|   SSH_TTY=/dev/pts/1
@end

@term
$ ng1> netstat -tupan			<<---- serve per verificare quali porte sono in ascolto
| Active Internet connections (servers and established)
| Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name
| tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      -
| tcp        0      0 127.0.0.1:22            127.0.0.1:56348         ESTABLISHED -
| tcp        0      0 127.0.0.1:56348         127.0.0.1:22            ESTABLISHED -
| tcp6       0      0 :::80                   :::*                    LISTEN      -
@end

@analysis
Analisi dell'output di netstat -tupan:

- Il flag -t mostra le connessioni TCP, -u le UDP, -p il PID/nome del processo, -a tutte le
  connessioni (LISTEN + ESTABLISHED), -n disabilita la risoluzione DNS (mostra IP numerici).
- Colonne dell'output:
    * Proto: il protocollo di trasporto (tcp per IPv4, tcp6 per IPv6).
    * Recv-Q: numero di byte nella coda di ricezione del socket non ancora letti
      dall'applicazione. Un valore > 0 persistente indica che l'applicazione non sta leggendo
      i dati abbastanza velocemente.
    * Send-Q: numero di byte nella coda di invio del socket non ancora confermati (ACK) dal
      peer remoto. Un valore > 0 persistente puo' indicare congestione di rete o un peer lento.
    * Local Address: indirizzo IP e porta su cui il socket e' in ascolto o connesso.
    * Foreign Address: indirizzo IP e porta del peer remoto (0.0.0.0:* per i socket in LISTEN).
    * State: lo stato della connessione TCP (LISTEN, ESTABLISHED, TIME_WAIT, ecc.).
    * PID/Program name: il PID e il nome del processo proprietario del socket. Il "-" indica
      che il processo appartiene a un altro utente o al namespace del container (mancanza di
      permessi per visualizzarlo).

- 0.0.0.0:80 (LISTEN): nginx e' in ascolto su tutte le interfacce IPv4 del container (wildcard
  address). Qualsiasi pacchetto TCP destinato alla porta 80, indipendentemente dall'interfaccia
  di arrivo (eth0, lo), verra' accettato.
- :::80 (LISTEN): e' l'equivalente IPv6 del wildcard address. Il triplo ":" e' la notazione
  compressa di [::]:80, cioe' l'indirizzo IPv6 non specificato (tutte le interfacce IPv6).
- 127.0.0.1:22 <-> 127.0.0.1:56348 (ESTABLISHED): la connessione SSH stabilita tramite
  loopback. La porta 22 e' il server sshd, la porta 56348 e' la porta effimera del client ssh.
  Le porte effimere vengono assegnate dal kernel dall'intervallo definito in
  /proc/sys/net/ipv4/ip_local_port_range (di solito 32768-60999).

Il flag -d in sshd (sshd -d&):

- Il flag -d avvia sshd in modalita' debug. In questa modalita', il server non esegue fork()
  per ogni connessione in arrivo (non si demonizza), gestisce una sola connessione alla volta
  e stampa i messaggi di debug su stderr. Questo e' utile per il troubleshooting, ma non e'
  adatto alla produzione.
- Il carattere "&" alla fine manda il processo in background nella shell corrente, permettendo
  di continuare a usare il terminale.
@end

@term
$ ng1> ip a			<<----- Serve per visualizzare l'indirizzo IP
| 1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
|     link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
|     inet 127.0.0.1/8 scope host lo
|        valid_lft forever preferred_lft forever
| 5: eth0@if6: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
|     link/ether 02:42:ac:11:00:02 brd ff:ff:ff:ff:ff:ff link-netnsid 0
|     inet 172.17.0.2/16 brd 172.17.255.255 scope global eth0
|        valid_lft forever preferred_lft forever
@end

@analysis
  Analisi del MAC address 02:42:ac:11:00:02:

  - I primi 3 byte (02:42:ac) formano l'OUI (Organizationally Unique Identifier). In particolare,
    il prefisso 02:42 e' riservato da Docker per le interfacce virtuali dei container.
    Il bit meno significativo del primo byte (02) indica che si tratta di un indirizzo
    "locally administered" (bit U/L = 1), cioe' non assegnato da un produttore hardware IEEE.
  - I restanti 3 byte (ac:11:00:02) sono la conversione esadecimale dell'indirizzo IPv4 del
    container: ac = 172, 11 = 17, 00 = 0, 02 = 2, ovvero 172.17.0.2.
    Docker genera automaticamente il MAC address a partire dall'IP assegnato al container,
    garantendo univocita' all'interno della rete bridge.

  - eth0@if6: il "@if6" indica che questa interfaccia e' l'estremita' di un veth pair. Il numero 6
    si riferisce all'indice dell'interfaccia corrispondente (veth) nel namespace di rete dell'host.
    Sull'host, l'interfaccia con indice 6 e' collegata al bridge docker0.

  - link-netnsid 0: identifica il network namespace di appartenenza dell'altra estremita' del veth
    pair (il namespace dell'host ha id 0).

  - La rete /16 (172.17.0.0/16) e' la subnet di default del bridge docker0. Docker assegna il
    gateway 172.17.0.1 al bridge sull'host e gli IP successivi ai container.
@end

Infine si esce con il comando:

@term
$ ng1> exit
@end

Per creare una nuova immagine nginx-ssh dal container ng1 si usa il comando: \`docker commit ng1 nginx-ssh\`

Per una eventuale eliminazione del container ng1 si usa il comando: \`docker rm -f ng1\`

## Creare un container dall'immagine nginx-ssh

Attiviamo un container dalla nuova immagine e facciamo qualche verifica

@term
$ docker run -d --name ns2 nginx-ssh
$ docker exec -it ns2 bash
@end

@term
$ ns2> netstat -tupan
| Active Internet connections (servers and established)
| Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name
| tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      1/nginx: master pro
| tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      7/sshd: sshd -d [li
| tcp6       0      0 :::80                   :::*                    LISTEN      1/nginx: master pro
| tcp6       0      0 :::22                   :::*                    LISTEN      7/sshd: sshd -d [li
@end

@term
$ ns2> ip a
| 1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
|     link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
|     inet 127.0.0.1/8 scope host lo
|        valid_lft forever preferred_lft forever
| 7: eth0@if8: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
|     link/ether 02:42:ac:11:00:03 brd ff:ff:ff:ff:ff:ff link-netnsid 0
|     inet 172.17.0.3/16 brd 172.17.255.255 scope global eth0
|        valid_lft forever preferred_lft forever
@end

## Verifica

Dall'immagine nginx-ssh creiamo due container ns2 e ns3 e verifichiamo il funzionamento del servizio ssh.

@term
$ docker run -d --name ns2 nginx-ssh
$ docker run -d --name ns3 nginx-ssh
$ docker ps
$ docker exec -it ns2 bash
@end

@term
$ ns2> ip a
| 1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
|     link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
|     inet 127.0.0.1/8 scope host lo
|        valid_lft forever preferred_lft forever
| 7: eth0@if8: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
|     link/ether 02:42:ac:11:00:03 brd ff:ff:ff:ff:ff:ff link-netnsid 0
|     inet 172.17.0.3/16 brd 172.17.255.255 scope global eth0
|        valid_lft forever preferred_lft forever
@end

@term
$ ns2> netstat -tupan
| Active Internet connections (servers and established)
| Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name
| tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      1/nginx: master pro
| tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      7/sshd: sshd -d [li
| tcp6       0      0 :::80                   :::*                    LISTEN      1/nginx: master pro
| tcp6       0      0 :::22                   :::*                    LISTEN      7/sshd: sshd -d [li
@end

@term
$ ns2> nmap 172.17.0.0/24
| Starting Nmap 7.93 ( https://nmap.org ) at 2024-09-24 20:28 UTC
| Nmap scan report for 172.17.0.1
| Host is up (0.000013s latency).
| All 1000 scanned ports on 172.17.0.1 are in ignored states.
| Not shown: 1000 closed tcp ports (reset)
| MAC Address: 02:42:03:47:E5:BD (Unknown)
|
| Nmap scan report for 172.17.0.2
| Host is up (0.000017s latency).
| Not shown: 999 closed tcp ports (reset)
| PORT   STATE SERVICE
| 80/tcp open  http
| MAC Address: 02:42:AC:11:00:02 (Unknown)
|
| Nmap scan report for 0e20583cc601 (172.17.0.3)
| Host is up (0.0000060s latency).
| Not shown: 998 closed tcp ports (reset)
| PORT   STATE SERVICE
| 22/tcp open  ssh
| 80/tcp open  http
|
| Nmap done: 256 IP addresses (3 hosts up) scanned in 2.25 seconds
@end

@term
$ ns2> ssh ubuntu@172.17.0.3
| Environment:
|   USER=ubuntu
|   LOGNAME=ubuntu
|   HOME=/home/ubuntu
|   PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin
|   SHELL=/bin/bash
|   TZ=UTC
|   TERM=xterm
|   SSH_CLIENT=172.17.0.3 52662 22
|   SSH_CONNECTION=172.17.0.3 52662 172.17.0.3 22
|   SSH_TTY=/dev/pts/1
@end

## Docker Compose

@cmds
docker-compose up -d 	---->> attiva il docker-compose in modalita' detach
docker-compose ps	---->> visualizza lo stato dei container avviati
docker compose down	---->> ferma e rimuove i container
@end

@analysis
Docker Compose e' uno strumento per definire e gestire applicazioni multi-container. Il file
YAML (docker-compose.yml o compose.yml) descrive l'intera infrastruttura dichiarando servizi,
reti e volumi.

- Servizi (services): ogni servizio corrisponde a un container. Il file definisce l'immagine
  da usare, le porte da esporre, i volumi da montare, le variabili d'ambiente, le dipendenze
  tra servizi (depends_on), ecc.
- Reti (networks): definiscono la topologia di rete. Compose crea di default una rete bridge
  dedicata per ogni progetto, isolando i container del progetto dagli altri.
- Volumi (volumes): definiscono i dati persistenti condivisi tra container o tra host e
  container.

Differenza tra docker-compose (v1) e docker compose (v2):

- docker-compose (con il trattino) e' la versione 1, scritta in Python. E' un binario separato
  che va installato indipendentemente dal Docker Engine. Utilizza le API Docker per orchestrare
  i container.
- docker compose (senza trattino) e' la versione 2, scritta in Go come plugin nativo del
  Docker CLI. E' piu' performante, supporta il formato Compose Specification e si integra
  direttamente nel comando docker. E' la versione consigliata e attivamente mantenuta.
- Nella pratica, i comandi sono quasi identici (up -d, ps, down), ma la v2 ha funzionalita'
  aggiuntive come i profili (profiles) e un migliore supporto per build multi-piattaforma.
@end

## Esercizio host remoto: www.unipr.it

@term
$ docker exec -it ns2 bash
@end

@term
$ dig +short www.unipr.it (oppure nslookup www.unipr.it)
# ----->> usando dig +short www.unipr.it
| d57y3tb4to0kw.cloudfront.net.
| 99.86.159.101
| 99.86.159.99
| 99.86.159.9
| 99.86.159.6
|
# ----->> usando nslookup www.unipr.it
| Server:         192.168.0.1
| Address:        192.168.0.1#53
|
| Non-authoritative answer:
| www.unipr.it    canonical name = d57y3tb4to0kw.cloudfront.net.
| Name:   d57y3tb4to0kw.cloudfront.net
| Address: 99.86.159.6
| Name:   d57y3tb4to0kw.cloudfront.net
| Address: 99.86.159.101
| Name:   d57y3tb4to0kw.cloudfront.net
| Address: 99.86.159.9
| Name:   d57y3tb4to0kw.cloudfront.net
| Address: 99.86.159.99
@end

@term
$ whois 108.139.229.28	<<------ informazioni amministrative
|
| # start
|
| NetRange:       108.128.0.0 - 108.139.255.255
| CIDR:           108.136.0.0/14, 108.128.0.0/13
| NetName:        AMAZO-4
| NetHandle:      NET-108-128-0-0-1
| Parent:         NET108 (NET-108-0-0-0-0)
| NetType:        Direct Allocation
| OriginAS:
| Organization:   Amazon.com, Inc. (AMAZO-4)
| RegDate:        2018-09-18
| Updated:        2018-09-18
| Ref:            https://rdap.arin.net/registry/ip/108.128.0.0
|
|
| OrgName:        Amazon.com, Inc.
| OrgId:          AMAZO-4
| Address:        Amazon Web Services, Inc.
| Address:        P.O. Box 81226
| City:           Seattle
| StateProv:      WA
| PostalCode:     98108-1226
| Country:        US
| RegDate:        2005-09-29
| Updated:        2022-09-30
| Comment:        For details of this service please see
| Comment:        http://ec2.amazonaws.com
| Ref:            https://rdap.arin.net/registry/entity/AMAZO-4
|
|
| OrgRoutingHandle: ARMP-ARIN
| OrgRoutingName:   AWS RPKI Management POC
| OrgRoutingPhone:  +1-206-555-0000
| OrgRoutingEmail:  aws-rpki-routing-poc@amazon.com
| OrgRoutingRef:    https://rdap.arin.net/registry/entity/ARMP-ARIN
|
| OrgTechHandle: ANO24-ARIN
| OrgTechName:   Amazon EC2 Network Operations
| OrgTechPhone:  +1-206-555-0000
| OrgTechEmail:  amzn-noc-contact@amazon.com
| OrgTechRef:    https://rdap.arin.net/registry/entity/ANO24-ARIN
|
| OrgNOCHandle: AANO1-ARIN
| OrgNOCName:   Amazon AWS Network Operations
| OrgNOCPhone:  +1-206-555-0000
| OrgNOCEmail:  amzn-noc-contact@amazon.com
| OrgNOCRef:    https://rdap.arin.net/registry/entity/AANO1-ARIN
|
| OrgRoutingHandle: IPROU3-ARIN
| OrgRoutingName:   IP Routing
| OrgRoutingPhone:  +1-206-555-0000
| OrgRoutingEmail:  aws-routing-poc@amazon.com
| OrgRoutingRef:    https://rdap.arin.net/registry/entity/IPROU3-ARIN
|
| OrgAbuseHandle: AEA8-ARIN
| OrgAbuseName:   Amazon EC2 Abuse
| OrgAbusePhone:  +1-206-555-0000
| OrgAbuseEmail:  trustandsafety@support.aws.com
| OrgAbuseRef:    https://rdap.arin.net/registry/entity/AEA8-ARIN
|
| # end
|
|
| # start
|
| NetRange:       108.138.0.0 - 108.139.255.255
| CIDR:           108.138.0.0/15
| NetName:        AMAZON-CF
| NetHandle:      NET-108-138-0-0-1
| Parent:         AMAZO-4 (NET-108-128-0-0-1)
| NetType:        Reallocated
| OriginAS:
| Organization:   Amazon.com, Inc. (AMAZON-4)
| RegDate:        2021-05-03
| Updated:        2021-05-03
| Ref:            https://rdap.arin.net/registry/ip/108.138.0.0
|
|
| OrgName:        Amazon.com, Inc.
| OrgId:          AMAZON-4
| Address:        1918 8th Ave
| City:           SEATTLE
| StateProv:      WA
| PostalCode:     98101-1244
| Country:        US
| RegDate:        1995-01-23
| Updated:        2022-09-30
| Ref:            https://rdap.arin.net/registry/entity/AMAZON-4
|
|
| OrgNOCHandle: AANO1-ARIN
| OrgNOCName:   Amazon AWS Network Operations
| OrgNOCPhone:  +1-206-555-0000
| OrgNOCEmail:  amzn-noc-contact@amazon.com
| OrgNOCRef:    https://rdap.arin.net/registry/entity/AANO1-ARIN
|
| OrgRoutingHandle: IPROU3-ARIN
| OrgRoutingName:   IP Routing
| OrgRoutingPhone:  +1-206-555-0000
| OrgRoutingEmail:  aws-routing-poc@amazon.com
| OrgRoutingRef:    https://rdap.arin.net/registry/entity/IPROU3-ARIN
|
| OrgTechHandle: ANO24-ARIN
| OrgTechName:   Amazon EC2 Network Operations
| OrgTechPhone:  +1-206-555-0000
| OrgTechEmail:  amzn-noc-contact@amazon.com
| OrgTechRef:    https://rdap.arin.net/registry/entity/ANO24-ARIN
|
| OrgAbuseHandle: AEA8-ARIN
| OrgAbuseName:   Amazon EC2 Abuse
| OrgAbusePhone:  +1-206-555-0000
| OrgAbuseEmail:  trustandsafety@support.aws.com
| OrgAbuseRef:    https://rdap.arin.net/registry/entity/AEA8-ARIN
|
| OrgRoutingHandle: ARMP-ARIN
| OrgRoutingName:   AWS RPKI Management POC
| OrgRoutingPhone:  +1-206-555-0000
| OrgRoutingEmail:  aws-rpki-routing-poc@amazon.com
| OrgRoutingRef:    https://rdap.arin.net/registry/entity/ARMP-ARIN
|
| # end
@end

@analysis
Analisi dell'output whois:

- Il protocollo WHOIS (RFC 3912) interroga i database dei Regional Internet Registries (RIR)
  per ottenere informazioni sull'assegnazione di blocchi di indirizzi IP.
- I 5 RIR mondiali sono: ARIN (Nord America), RIPE NCC (Europa/Medio Oriente/Asia Centrale),
  APNIC (Asia-Pacifico), LACNIC (America Latina/Caraibi), AFRINIC (Africa).
- In questo caso, la risposta proviene da ARIN (rdap.arin.net) perche' il blocco IP
  108.128.0.0/13 e' assegnato ad Amazon.com, Inc., la cui sede e' a Seattle, WA (USA).

- Significato dei campi principali:
    * NetRange (108.128.0.0 - 108.139.255.255): l'intervallo di indirizzi IP assegnato.
    * CIDR (108.136.0.0/14, 108.128.0.0/13): la notazione CIDR equivalente. /13 indica una
      maschera di 13 bit, cioe' 524.288 indirizzi IP (2^19).
    * NetName (AMAZO-4): nome identificativo del blocco nel database ARIN.
    * NetType (Direct Allocation): il blocco e' stato assegnato direttamente da ARIN
      all'organizzazione. "Reallocated" (nel secondo blocco) indica che il blocco e' stato
      ri-assegnato internamente da Amazon.
    * OriginAS: l'Autonomous System (AS) di origine. Se presente, indica il numero AS da cui
      il blocco viene annunciato via BGP (Border Gateway Protocol).
    * Organization: l'entita' legale proprietaria del blocco di indirizzi.

- Il secondo blocco (108.138.0.0/15, NetName: AMAZON-CF) e' un sotto-blocco riallocato
  specificamente per Amazon CloudFront, la CDN (Content Delivery Network) di AWS.
  Questo conferma che il sito www.unipr.it e' servito tramite la CDN CloudFront di Amazon.
@end

Per determinare il percorso (catena di router attraversati) eseguiamo il comando:

@term
$ traceroute 108.139.229.28
|
| traceroute to 108.139.229.28 (108.139.229.28), 30 hops max, 60 byte packets
|  1  172.17.0.1 (172.17.0.1)  0.861 ms  0.763 ms  0.706 ms
|  2  192.168.0.1 (192.168.0.1)  6.417 ms  9.583 ms  10.464 ms
|  3  <NOME_RETE>.lan (192.168.xxx.xxx)  10.774 ms  11.260 ms  11.863 ms
|  4  172.23.0.1 (172.23.0.1)  210.964 ms  210.944 ms  210.381 ms
|  5  192.168.xxx.xxx (192.168.xxx.xxx)  215.619 ms  215.868 ms  214.867 ms
|  6  host-217-19-158-57.ip.retelit.it (217.19.158.57)  210.835 ms  104.015 ms  103.655 ms
|  7  host-46-243-33-38.ip.retelit.it (46.243.33.38)  103.746 ms * *
|  8  mno-b3-link.ip.twelve99.net (80.239.192.68)  133.391 ms *  133.201 ms
|  9  amazon-ic-333370.ip.twelve99-cust.net (80.239.128.221)  133.126 ms  66.301 ms  66.360 ms
| 10  * * *
| 11  * * *
| 12  * * *
| 13  * * *
| 14  * * *
| 15  * * *
| 16  * * *
| 17  150.222.129.144 (150.222.129.144)  112.626 ms 150.222.129.145 (150.222.129.145)  112.426 ms  114.789 ms
| 18  * * *
| 19  * * *
| 20  * * *
| 21  * * *
| 22  * * *
| 23  * * *
| 24  * * *
| 25  * * *
| 26  * * *
| 27  * * *
| 28  * * *
| 29  * * *
| 30  * * *
@end

@analysis
Come funziona traceroute:

- traceroute sfrutta il campo TTL (Time To Live) dell'header IP. Invia pacchetti UDP (o ICMP)
  con TTL inizialmente impostato a 1, poi 2, poi 3, e cosi' via.
- Ogni router che riceve un pacchetto decrementa il TTL di 1. Quando il TTL raggiunge 0, il
  router scarta il pacchetto e invia al mittente un messaggio ICMP "Time Exceeded" (tipo 11,
  codice 0). Questo messaggio contiene l'indirizzo IP del router, permettendo di identificarlo.
- Per ogni hop, traceroute invia 3 pacchetti (da cui i 3 tempi di RTT mostrati per ogni riga).

Analisi del percorso:

- Hop 1 (172.17.0.1): e' il gateway del bridge docker0 (l'interfaccia del bridge sull'host).
  RTT bassissimo (~0.8 ms) perche' e' una comunicazione locale tramite veth pair.
- Hop 2 (192.168.0.1): e' il gateway della rete locale dell'host (router di casa/ufficio).
- Hop 3-5: attraversamento della rete dell'ISP locale.
- Hop 6-7 (retelit.it): backbone dell'operatore italiano Retelit.
- Hop 8 (twelve99.net): peering con Arelion (ex Telia Carrier), un Tier-1 provider globale.
- Hop 9 (amazon-ic): punto di interconnessione (peering) tra Arelion e la rete Amazon AWS.
- Hop 10-16 (* * *): i router della rete interna di Amazon non rispondono ai messaggi ICMP
  Time Exceeded. Questo e' un comportamento tipico delle reti di grandi provider che
  configurano i router per droppare (scartare silenziosamente) i pacchetti ICMP in ingresso
  o per non generare messaggi ICMP Time Exceeded. Le ragioni sono:
    * Sicurezza: nascondere la topologia interna della rete.
    * Performance: ridurre il carico di elaborazione sui router di core.
    * Policy: regole ACL/firewall che filtrano il traffico ICMP.
- Hop 17 (150.222.129.144/145): un nodo della rete Amazon che risponde, probabilmente un
  edge router vicino al PoP (Point of Presence) di CloudFront.
- Hop 18-30 (* * *): la destinazione finale probabilmente non risponde a UDP/ICMP, oppure
  i router rimanenti continuano a filtrare i messaggi ICMP.
@end

## Esercizio Host remoto

@term
$ docker exec -it ns2 bash
@end

Determinare l'RTT:

@term
$ ns2> ping -c 1 www.unipr.it
|
| PING d57y3tb4to0kw.cloudfront.net (99.86.159.99) 56(84) bytes of data.
| 64 bytes from server-99-86-159-99.mxp64.r.cloudfront.net (99.86.159.99): icmp_seq=1 ttl=244 time=19.5 ms
|
| --- d57y3tb4to0kw.cloudfront.net ping statistics ---
| 1 packets transmitted, 1 received, 0% packet loss, time 0ms
| rtt min/avg/max/mdev = 19.461/19.461/19.461/0.000 ms
@end

Determinare il throughput

@term
$ ns2> wget https://www.unipr.it/sites/default/files/2024-04/BreveGuida-IT-2024-2025.pdf
| -2024-09-24 20:44:56--  https://www.unipr.it/sites/default/files/2024-04/BreveGuida-IT-2024-2025.pdf
| Resolving www.unipr.it (www.unipr.it)... 99.86.159.101, 99.86.159.9, 99.86.159.6, ...
| Connecting to www.unipr.it (www.unipr.it)|99.86.159.101|:443... connected.
| HTTP request sent, awaiting response... 200 OK
| Length: 5121440 (4.9M) [application/pdf]
| Saving to: 'BreveGuida-IT-2024-2025.pdf.1'
|
| BreveGuida-IT-2024-2025.pdf         100%[======================================================================>]   4.88M  3.04MB/s    in 1.6s
@end

@analysis
Analisi del throughput del wget:

- Dimensione del file: 5.121.440 byte = 4,88 MB (1 MB = 1.048.576 byte).
- Tempo di download: 1,6 secondi.
- Throughput misurato: 4,88 MB / 1,6 s = 3,05 MB/s (megabyte al secondo).
- Conversione in bit al secondo: 3,05 MB/s * 8 = 24,4 Mbit/s.
- Nota: wget misura il throughput a livello applicativo (payload HTTP), escludendo l'overhead
  dei protocolli sottostanti (header TCP/IP, handshake TLS, header HTTP). Il throughput reale
  a livello di rete (goodput + overhead) e' leggermente superiore.
- Il download avviene su HTTPS (porta 443), quindi il traffico e' cifrato con TLS. L'handshake
  TLS aggiunge latenza iniziale (circa 1-2 RTT extra per negoziare la chiave di sessione),
  ma non influisce significativamente sul throughput per file di grandi dimensioni.
- Il server risponde dall'edge node CloudFront "mxp64" (Malpensa/Milano), il che spiega la
  bassa latenza (19,5 ms RTT) e il buon throughput: il contenuto e' in cache sul nodo CDN
  piu' vicino al client.
@end
`;export{e as default};
