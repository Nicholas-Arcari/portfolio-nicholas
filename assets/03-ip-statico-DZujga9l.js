const e=`  _                _                              _                    _               ____
 | |              | |                            | |                  (_)             |___ \\
 | |        __ _  | |__     ___    _ __    __ _  | |_    ___    _ __   _    ___         __) |
 | |       / _\` | | '_ \\   / _ \\  | '__|  / _\` | | __|  / _ \\  | '__| | |  / _ \\       |__ <
 | |____  | (_| | | |_) | | (_) | | |    | (_| | | |_  | (_) | | |    | | | (_) |      ___) |
 |______|  \\__,_| |_.__/   \\___/  |_|     \\__,_|  \\__|  \\___/  |_|    |_|  \\___/      |____/



 	----------------------------------------
 		+++++ Docker Bridge +++++
 	----------------------------------------


# Per creare un bridge definito dall'utente.
docker network create -d bridge bridge1 --subnet=172.21.0.0/24
ba7dace25907c6fb136b25e0d1caa1d78739b562bcb2c40bd08725526b936cb6


# E' possibile assegnare un indirizzo IP statico solo a bridge definiti dall'utente
# Per eseguire un container con indirizzo IP assegnato staticamente:
docker run -d --name ns5 --network bridge1 --ip 172.21.0.11 nginx-ssh
docker ps
CONTAINER ID   IMAGE       COMMAND                  CREATED          STATUS         PORTS            NAMES
3642a1de07e1   nginx-ssh   "/docker-entrypoint..."   10 seconds ago   Up 6 seconds   22/tcp, 80/tcp   ns5

#per rimuovere il bridge
docker network rm bridge1
Error response from daemon: error while removing network: network bridge1 id ba7dace25907c6fb136b25e0d1caa1d78739b562bcb2c40bd08725526b936cb6 has active endpoints

# E' necessario prima sospendere il docker ns5, altrimenti dara' l'errore mostrato sopra


[Analisi a basso livello]

  Quando si crea un bridge user-defined con \`docker network create -d bridge bridge1 --subnet=172.21.0.0/24\`,
  Docker esegue le seguenti operazioni a livello kernel:

  1. Crea un Linux bridge (analogo a uno switch L2 virtuale) usando il modulo kernel \`bridge\`.
     Sul'host compare una nuova interfaccia di rete (es. br-ba7dace25907) visibile con \`ip link show\`.

  2. Assegna al bridge l'indirizzo gateway della subnet, ovvero 172.21.0.1/24. Questo IP e' raggiungibile
     dall'host e funge da default gateway per i container collegati.

  3. Configura l'IPAM (IP Address Management) di Docker per allocare IP dal pool 172.21.0.0/24.

  Perche' l'IP statico funziona SOLO con bridge user-defined:
  - Il bridge di default "docker0" (172.17.0.0/16) usa un IPAM integrato che assegna IP sequenzialmente.
    Docker non espone l'opzione --ip per il bridge di default per evitare conflitti con l'allocazione automatica.
  - I bridge user-defined hanno un IPAM separato e controllabile, che permette la prenotazione di IP specifici.

  Per ogni container collegato al bridge, Docker crea una coppia di interfacce virtuali (veth pair):
  - Un'estremita' (eth0) e' visibile all'interno del network namespace del container.
  - L'altra estremita' (vethXXXXXX) e' collegata al bridge sull'host, fungendo da "porta" dello switch.

  L'errore "has active endpoints" si verifica perche' il bridge ha ancora veth pairs attivi collegati.
  Prima di rimuoverlo occorre disconnettere o eliminare tutti i container connessi.

[/Analisi]



	-----------------------------------------------------------
		+++++ IP statico + port forwarding +++++
	-----------------------------------------------------------

Vogliamo creare un container con un IP che definiamo staticamente e il port forwarding per i 2 servizi di nginx-ssh:

> docker network create -d bridge bridge1 --subnet=172.21.0.0/24
05430718cc8c92930e58b9070964ae597092936191ffd38cfdab3325ce73bb16

> docker run -d --name ns6 -p 2006:22 -p 8006:80 --network bridge1 --ip 172.21.0.6  -v /home/nick/Scrivania/Unipr/RetiDeiCalcolatori/RETI2425/html:/var/www/html cyberteam1/nginx-ssh
db5fefd766b48de93061d405dcc9e76d3620ce29ca7ceff61a19ab90b182177c


> docker ps
CONTAINER ID   IMAGE                  COMMAND                  CREATED              STATUS              PORTS                                                                          NAMES
db5fefd766b4   cyberteam1/nginx-ssh   "/docker-entrypoint..."   About a minute ago   Up About a minute   0.0.0.0:2006->22/tcp, :::2006->22/tcp, 0.0.0.0:8006->80/tcp, :::8006->80/tcp   ns6


[Analisi a basso livello]

  Il flag -p (publish) implementa il port forwarding tramite regole iptables nella tabella nat:

  Come Docker implementa -p 2006:22:
  1. Crea una regola DNAT (Destination NAT) nella chain DOCKER della tabella nat:
     iptables -t nat -A DOCKER -p tcp --dport 2006 -j DNAT --to-destination 172.21.0.6:22
     Questa regola riscrive l'IP di destinazione e la porta di ogni pacchetto TCP in arrivo sulla porta
     2006 dell'host, sostituendoli con 172.21.0.6:22 (IP e porta del container).

  2. Crea una regola ACCEPT nella chain DOCKER della tabella filter:
     iptables -A DOCKER -d 172.21.0.6 -p tcp --dport 22 -j ACCEPT
     Permette al pacchetto (gia' reindirizzato) di raggiungere il container.

  3. Docker avvia un processo docker-proxy (userland proxy) in ascolto sulla porta 2006 dell'host
     come fallback per il traffico proveniente dallo stesso host (hairpin NAT).

  Lettura dell'output di docker ps:
  - "0.0.0.0:2006->22/tcp": ascolta su TUTTE le interfacce IPv4 dell'host (0.0.0.0) sulla porta 2006,
    e inoltra alla porta 22 del container. Questo include localhost, IP della rete WiFi, ecc.
  - ":::2006->22/tcp": equivalente per IPv6 (:: = tutte le interfacce IPv6).

  Implicazione di sicurezza: il binding su 0.0.0.0 espone il servizio a TUTTA la rete. Un attaccante
  sulla stessa rete puo' raggiungere direttamente il servizio SSH del container. Per limitare l'esposizione
  si puo' specificare un IP di binding: -p 127.0.0.1:2006:22 (solo localhost).

  Il flag -v monta un bind mount: il path dell'host (/home/nick/.../html) viene reso accessibile nel
  container come /var/www/html. Il container legge e scrive direttamente sul filesystem dell'host.
  Rischio: se il container viene compromesso, l'attaccante ha accesso in lettura/scrittura ai file dell'host.

[/Analisi]



	----------------------------------------------------------------------------------------------
		Esercizio: assegnare un IP statico e attivare il port forwarding in Docker.
	----------------------------------------------------------------------------------------------

> mkdir dockerIPStatico

> cd dockerIPStatico

> wget http://didattica-linux.unipr.it/~roberto.alfieri@unipr.it/matdid/RETI/docker/IPStatico/compose.yml

--2024-10-08 18:39:55--  http://didattica-linux.unipr.it/~roberto.alfieri@unipr.it/matdid/RETI/docker/IPStatico/compose.yml
Risoluzione di didattica-linux.unipr.it (didattica-linux.unipr.it)... 160.78.50.165
Connessione a didattica-linux.unipr.it (didattica-linux.unipr.it)|160.78.50.165|:80... connesso.
Richiesta HTTP inviata, in attesa di risposta... 200 OK
Lunghezza: 450
Salvataggio in: «compose.yml»

compose.yml                     100%[=====================================================>]     450  --.-KB/s    in 0s

2024-10-08 18:39:55 (14,5 MB/s) - «compose.yml» salvato [450/450]


#Ho riadattato il file appena scaricato compose.yml come segue (sono il numero 6 nell'elenco) :
networks:
  bridge1:
    name: bridge1
    driver: bridge
    ipam:
      config:
        - subnet: 172.21.0.0/24

services:
  ns11:
    container_name: ns11
    hostname: ns11
    image: cyberteam1/nginx-ssh
    networks:
      bridge1:
       ipv4_address: 172.21.0.6
    ports:
      - "2006:22"
      - "8006:80"
    volumes:
      - '../Scrivania/Unipr/RetiDeiCalcolatori/RETI2425/html/:/var/www/html'


[Analisi a basso livello]

  Struttura del file compose.yml e significato di ogni sezione:

  networks:
    Definisce la topologia di rete L2. Ogni network crea un Linux bridge isolato sull'host.
    - name: bridge1 -> nome del bridge visibile con \`docker network ls\`
    - driver: bridge -> usa il driver bridge nativo di Docker (altri driver: overlay, macvlan, host, none)
    - ipam.config.subnet: 172.21.0.0/24 -> pool di 254 indirizzi utilizzabili (172.21.0.1-254).
      Docker assegna automaticamente il .1 al gateway (interfaccia del bridge sull'host).
      La notazione CIDR /24 indica che i primi 24 bit sono la parte di rete, gli ultimi 8 la parte host.
      Subnet mask equivalente: 255.255.255.0. Broadcast: 172.21.0.255.

  services:
    Ogni servizio corrisponde a un container.
    - container_name e hostname: rispettivamente il nome Docker e l'hostname Linux del container
      (impostato nel UTS namespace del container tramite sethostname()).
    - image: l'immagine da cui creare il container (viene cercata prima nel local registry, poi su Docker Hub).
    - networks.bridge1.ipv4_address: IP statico del container su bridge1.
    - ports: mappatura host:container (DNAT tramite iptables, come spiegato sopra).
    - volumes: bind mount host:container (montato nel mount namespace del container).

  Differenza tra docker-compose (v1) e docker compose (v2):
  - v1: script Python installato separatamente (\`docker-compose\`), utilizza il formato Compose v2/v3.
  - v2: plugin Go integrato nel CLI Docker (\`docker compose\`), piu' veloce e mantenuto attivamente.
  Entrambi leggono lo stesso formato YAML, ma v2 e' il successore ufficiale.

[/Analisi]


> docker-compose up -d
Creating network "bridge1" with driver "bridge"
Creating ns11 ... done

> docker ps
CONTAINER ID   IMAGE                  COMMAND                  CREATED         STATUS         PORTS                                                                          NAMES
6d31b87f15e6   cyberteam1/nginx-ssh   "/docker-entrypoint..."   3 minutes ago   Up 3 minutes   0.0.0.0:2006->22/tcp, :::2006->22/tcp, 0.0.0.0:8006->80/tcp, :::8006->80/tcp   ns11

> docker exec ns11  ls /var/www/html/
test.html

> ssh ubuntu@localhost -p 2006
The authenticity of host '[localhost]:2006 ([::1]:2006)' can't be established.
ED25519 key fingerprint is SHA256:LB3Ms/DT4dEpcYsnq3DdXfojqT08VDApPMh1fdmSV90.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '[localhost]:2006' (ED25519) to the list of known hosts.
ubuntu@localhost's password:
Welcome to Ubuntu 23.04 (GNU/Linux 6.10.9-amd64 x86_64)

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

ubuntu@ns11:~$ exit
logout
Connection to localhost closed.

> curl http://localhost:8006/test.html
<H1> Hello World! </H1>

> docker rm -f ns11
ns11


[Analisi a basso livello]

  Verifica del port forwarding:

  1. ssh ubuntu@localhost -p 2006: il client SSH si connette a localhost:2006. Il pacchetto TCP SYN
     viene intercettato dalle regole iptables DNAT di Docker e reindirizzato a 172.21.0.6:22 (container ns11).
     Il fingerprint ED25519 (SHA256:LB3Ms/...) identifica univocamente la chiave host del server SSH nel container.
     Al primo collegamento viene chiesta conferma manuale -> rischio di attacco MITM se il fingerprint non viene verificato.
     Nota: [::1]:2006 indica che la connessione usa l'indirizzo di loopback IPv6.

  2. curl http://localhost:8006/test.html: la richiesta HTTP viene reindirizzata a 172.21.0.6:80 (NGINX nel container).
     NGINX serve il file test.html dalla document root /var/www/html che e' il bind mount del filesystem host.

  Il percorso completo di un pacchetto dall'host al container:
  Host (localhost:2006) -> iptables PREROUTING/DNAT -> routing decision -> bridge1 -> veth pair -> container eth0:22

  docker rm -f ns11: il flag -f (force) invia SIGKILL al processo principale del container (PID 1 nel namespace),
  senza attendere il graceful shutdown (SIGTERM + timeout). Equivale a docker stop + docker rm ma senza grazia.

[/Analisi]
`;export{e as default};
