const e=`  _                _                              _                    _              ___
 | |              | |                            | |                  (_)            / _ \\
 | |        __ _  | |__     ___    _ __    __ _  | |_    ___    _ __   _    ___     | (_) |
 | |       / _\` | | '_ \\   / _ \\  | '__|  / _\` | | __|  / _ \\  | '__| | |  / _ \\     \\__, |
 | |____  | (_| | | |_) | | (_) | | |    | (_| | | |_  | (_) | | |    | | | (_) |      / /
 |______|  \\__,_| |_.__/   \\___/  |_|     \\__,_|  \\__|  \\___/  |_|    |_|  \\___/      /_/




	============================================================
		Introduzione teorica al protocollo TLS
	============================================================

# TLS (Transport Layer Security): protocollo crittografico che si posiziona
# tra il livello trasporto (TCP) e il livello applicazione (HTTP), creando
# un canale cifrato, autenticato e integro.

# Evoluzione storica:
# SSL 2.0 (1995, vulnerabile) -> SSL 3.0 (1996, vulnerabile a POODLE) ->
# TLS 1.0 (1999) -> TLS 1.1 (2006) -> TLS 1.2 (2008) -> TLS 1.3 (2018, attuale standard)

# TLS 1.2 Handshake:
# ClientHello (cipher suites supportate, random) ->
# ServerHello (cipher suite scelta, random) + Certificate (certificato X.509) +
# ServerKeyExchange + ServerHelloDone ->
# ClientKeyExchange (pre-master secret cifrato con chiave pubblica server) +
# ChangeCipherSpec + Finished ->
# ChangeCipherSpec + Finished.
# Da questo momento i dati viaggiano cifrati.

# TLS 1.3 Handshake semplificato:
# 1-RTT (un solo round-trip) grazie alla key share nel ClientHello.
# Il numero di messaggi scambiati si riduce drasticamente, migliorando
# sia la latenza sia la sicurezza (rimozione di cipher suite deboli).


	------------------------------------------------------------
		Configurazione  di un  Virtual Host  HTTPS
	------------------------------------------------------------

# Avviso: questa task e' stata fatta usando la WSL "kali-linux" su un PC con sistema operativo Windows --> causa di cio': non funziona FortiClient VPN sul mio computer con Kali Linux come sistema operativo.
# Configuriamo NGINX aggiungendo un Virtual Host HTTPS  https://techexpert.tips/it/nginx-it/abilitare-https-su-nginxenable-https-on-nginx/


> sudo apt update -y
[sudo] password for nick:
Get:1 http://kali.download/kali kali-last-snapshot InRelease [41.5 kB]
Get:2 http://kali.download/kali kali-last-snapshot/main amd64 Packages [20.3 MB]
Get:3 http://kali.download/kali kali-last-snapshot/main amd64 Contents (deb) [49.4 MB]
Get:4 http://kali.download/kali kali-last-snapshot/contrib amd64 Packages [112 kB]
Get:5 http://kali.download/kali kali-last-snapshot/contrib amd64 Contents (deb) [274 kB]
Get:6 http://kali.download/kali kali-last-snapshot/non-free amd64 Packages [197 kB]
Get:7 http://kali.download/kali kali-last-snapshot/non-free amd64 Contents (deb) [877 kB]
Get:8 http://kali.download/kali kali-last-snapshot/non-free-firmware amd64 Packages [10.6 kB]
Get:9 http://kali.download/kali kali-last-snapshot/non-free-firmware amd64 Contents (deb) [23.1 kB]
Fetched 71.2 MB in 55s (1,292 kB/s)
209 packages can be upgraded. Run 'apt list --upgradable' to see them.


> sudo apt install nginx openssl
Upgrading:
  libssl3t64  openssl

Installing:
  nginx

Installing dependencies:
  nginx-common  openssl-provider-legacy

Suggested packages:
  fcgiwrap  nginx-doc  ssl-cert

Summary:
  Upgrading: 2, Installing: 3, Removing: 0, Not Upgrading: 207
  Download size: 4,667 kB
  Space needed: 2,318 kB / 1,025 GB available

Continue? [Y/n] y
Get:1 http://kali.download/kali kali-last-snapshot/main amd64 openssl-provider-legacy amd64 3.3.2-2 [298 kB]
Get:4 http://http.kali.org/kali kali-last-snapshot/main amd64 nginx amd64 1.26.0-3+b1 [609 kB]
Get:2 http://kali.download/kali kali-last-snapshot/main amd64 libssl3t64 amd64 3.3.2-2 [2,271 kB]
Get:3 http://kali.download/kali kali-last-snapshot/main amd64 nginx-common all 1.26.0-3 [108 kB]
Get:5 http://kali.download/kali kali-last-snapshot/main amd64 openssl amd64 3.3.2-2 [1,382 kB]
Fetched 4,667 kB in 4s (1,240 kB/s)
Preconfiguring packages ...
(Reading database ... 30034 files and directories currently installed.)
Preparing to unpack .../libssl3t64_3.3.2-2_amd64.deb ...
Unpacking libssl3t64:amd64 (3.3.2-2) over (3.2.2-1) ...
Selecting previously unselected package openssl-provider-legacy.
Preparing to unpack .../openssl-provider-legacy_3.3.2-2_amd64.deb ...
Unpacking openssl-provider-legacy (3.3.2-2) ...
Setting up libssl3t64:amd64 (3.3.2-2) ...
Setting up openssl-provider-legacy (3.3.2-2) ...
Selecting previously unselected package nginx-common.
(Reading database ... 30038 files and directories currently installed.)
Preparing to unpack .../nginx-common_1.26.0-3_all.deb ...
Unpacking nginx-common (1.26.0-3) ...
Selecting previously unselected package nginx.
Preparing to unpack .../nginx_1.26.0-3+b1_amd64.deb ...
Unpacking nginx (1.26.0-3+b1) ...
Preparing to unpack .../openssl_3.3.2-2_amd64.deb ...
Unpacking openssl (3.3.2-2) over (3.2.2-1) ...
Setting up nginx-common (1.26.0-3) ...
update-rc.d: We have no instructions for the nginx init script.
update-rc.d: It looks like a network service, we disable it.
Setting up openssl (3.3.2-2) ...
Setting up nginx (1.26.0-3+b1) ...
invoke-rc.d: could not determine current runlevel
Processing triggers for libc-bin (2.38-13) ...

[Analisi a basso livello]
L'installazione di NGINX e OpenSSL coinvolge diversi componenti fondamentali:
- libssl3t64: la libreria OpenSSL condivisa (.so), fornisce le primitive crittografiche
  (AES, RSA, SHA, ecc.) utilizzate sia da NGINX che dal comando openssl. L'aggiornamento
  da 3.2.2-1 a 3.3.2-2 corregge potenziali vulnerabilita' (CVE) nelle implementazioni
  dei cifrari.
- openssl-provider-legacy: modulo provider che implementa algoritmi obsoleti (MD4, RC4,
  DES, ecc.) necessari per retrocompatibilita' ma sconsigliati per nuove configurazioni.
- nginx-common: file di configurazione condivisi (/etc/nginx/nginx.conf, directory
  sites-available/ e sites-enabled/). Il messaggio "update-rc.d: It looks like a network
  service, we disable it" indica che il sistema init (SysVinit/systemd) non avvia NGINX
  automaticamente al boot, perche' siamo in un ambiente WSL dove il gestore dei servizi
  e' limitato.
- Il pacchetto nginx stesso contiene il binario /usr/sbin/nginx compilato con il modulo
  ngx_http_ssl_module che wrappa le chiamate a libssl per gestire il TLS handshake.
[/Analisi]


>mkdir Scrivania/RETI2425/DockerHTTPS

> cd Scrivania/RETI2425/DockerHTTPS


> wget http://didattica-linux.unipr.it/~roberto.alfieri@unipr.it/matdid/RETI/docker/HTTPS/compose.yml
--2024-12-07 19:22:31--  http://didattica-linux.unipr.it/~roberto.alfieri@unipr.it/matdid/RETI/docker/HTTPS/compose.yml
Resolving didattica-linux.unipr.it (didattica-linux.unipr.it)... 160.78.50.165
Connecting to didattica-linux.unipr.it (didattica-linux.unipr.it)|160.78.50.165|:80... connected.
HTTP request sent, awaiting response... 200 OK
Length: 570
Saving to: <<compose.yml>>

compose.yml                                         100%[=================================================================================================================>]     570  --.-KB/s    in 0s

2024-12-07 19:22:31 (76.0 MB/s) - <<compose.yml>> saved [570/570]


> wget http://didattica-linux.unipr.it/~roberto.alfieri@unipr.it/matdid/RETI/docker/HTTPS/index.html
--2024-12-07 19:23:33--  http://didattica-linux.unipr.it/~roberto.alfieri@unipr.it/matdid/RETI/docker/HTTPS/index.html
Resolving didattica-linux.unipr.it (didattica-linux.unipr.it)... 160.78.50.165
Connecting to didattica-linux.unipr.it (didattica-linux.unipr.it)|160.78.50.165|:80... connected.
HTTP request sent, awaiting response... 200 OK
Length: 19 [text/html]
Saving to: 'index.html'

index.html                                          100%[=================================================================================================================>]      19  --.-KB/s    in 0s

2024-12-07 19:23:33 (2.19 MB/s) - <<index.html>> saved [19/19]


# Programmazione HTTPS con Python a livello trasporto:
> wget http://didattica-linux.unipr.it/~roberto.alfieri@unipr.it/matdid/RETI/docker/HTTPS/https_client_transp.py
--2024-12-07 19:25:10--  http://didattica-linux.unipr.it/~roberto.alfieri@unipr.it/matdid/RETI/docker/HTTPS/https_client_transp.py
Resolving didattica-linux.unipr.it (didattica-linux.unipr.it)... 160.78.50.165
Connecting to didattica-linux.unipr.it (didattica-linux.unipr.it)|160.78.50.165|:80... connected.
HTTP request sent, awaiting response... 200 OK
Length: 1094 (1.1K) [text/x-python]
Saving to: <<https_client_transp.py>>

https_client_transp.py                              100%[=================================================================================================================>]   1.07K  --.-KB/s    in 0s

2024-12-07 19:25:10 (132 MB/s) - <<https_client_transp.py>> saved [1094/1094]


# Programmazione HTTPS con Python3 a livello applicazione:
> wget http://didattica-linux.unipr.it/~roberto.alfieri@unipr.it/matdid/RETI/docker/HTTPS/https_client_appl.py
--2024-12-07 19:25:40--  http://didattica-linux.unipr.it/~roberto.alfieri@unipr.it/matdid/RETI/docker/HTTPS/https_client_appl.py
Resolving didattica-linux.unipr.it (didattica-linux.unipr.it)... 160.78.50.165
Connecting to didattica-linux.unipr.it (didattica-linux.unipr.it)|160.78.50.165|:80... connected.
HTTP request sent, awaiting response... 200 OK
Length: 892 [text/x-python]
Saving to: 'https_client_appl.py'

https_client_appl.py                                100%[=================================================================================================================>]     892  --.-KB/s    in 0s

2024-12-07 19:25:40 (98.9 MB/s) - <<https_client_appl.py>> saved [892/892]

[Analisi a basso livello]
I file scaricati dal server didattica-linux.unipr.it transitano in chiaro su HTTP (porta 80),
senza alcuna cifratura. Un attaccante sulla stessa rete potrebbe intercettare il traffico
(sniffing) e modificare i file in transito (attacco Man-in-the-Middle). Ad esempio, potrebbe
iniettare codice maligno nel file Python https_client_transp.py prima che raggiunga il client.
In un ambiente di produzione, i file andrebbero scaricati tramite HTTPS.

Il file compose.yml (570 byte) definisce l'infrastruttura Docker: due container basati sulla
stessa immagine cyberteam1/nginx-ssh, che include sia il web server NGINX sia il server SSH
(OpenSSH). Questa immagine viola il principio "un processo per container" di Docker, ma e'
utile a scopo didattico per permettere sia l'accesso remoto sia il servizio web.

Il file https_client_transp.py (1094 byte) implementa un client HTTPS a livello trasporto
usando il modulo ssl di Python, che wrappa la libreria OpenSSL. Il file https_client_appl.py
(892 byte) utilizza invece il modulo http.client che opera a livello applicazione, astraendo
i dettagli del socket e del TLS handshake.
[/Analisi]


# Sistemato il volume del compose e avviati i container:
> nano compose.yml
services:
  ns3:
    privileged: true
    container_name: ns3
    hostname: ns3
    image: cyberteam1/nginx-ssh
    network_mode: bridge
    ports:
      - "4443:4443"
    volumes:
      -  ../RETI2425/DockerHTTPS:/var/www/html


  ns2:
    container_name: ns2
    hostname: ns2
    image: cyberteam1/nginx-ssh
    network_mode: bridge
    volumes:
      -  ../RETI2425/DockerHTTPS:/var/www/html


> docker-compose up -d
[+] Running 2/2
 ✔ Container ns2  Started                                                                                                                                                                                1.2s
 ✔ Container ns3  Started                                                                                                                                                                                1.3s


> docker ps -a
CONTAINER ID   IMAGE                  COMMAND                  CREATED          STATUS          PORTS                                    NAMES
e988490ae61d   cyberteam1/nginx-ssh   "/docker-entrypoint..."   45 seconds ago   Up 44 seconds   22/tcp, 80/tcp                           ns2
7c9dbca8e2be   cyberteam1/nginx-ssh   "/docker-entrypoint..."   45 seconds ago   Up 44 seconds   22/tcp, 80/tcp, 0.0.0.0:4443->4443/tcp   ns3

[Analisi a basso livello]
Il compose.yml definisce due servizi Docker con configurazioni distinte:

- ns3 (server HTTPS): ha "privileged: true", che disabilita tutti i meccanismi di
  isolamento del kernel (seccomp, AppArmor, capabilities limitate). Questo e' necessario
  per eseguire comandi come "service nginx reload" dentro il container, ma in produzione
  e' un grave rischio di sicurezza: un processo compromesso nel container avrebbe accesso
  diretto al kernel dell'host. Il port forwarding "4443:4443" crea una regola iptables
  DNAT sull'host: i pacchetti destinati a host:4443 vengono re-indirizzati a
  container_ip:4443 attraverso il bridge Docker (docker0, di default 172.17.0.1/16).

- ns2 (client): non ha port forwarding ne' privileged, funge da client isolato sulla
  stessa rete bridge. Puo' raggiungere ns3 tramite l'indirizzo IP interno 172.17.0.3.

- network_mode: bridge -> entrambi i container sono connessi alla rete bridge di default
  di Docker (172.17.0.0/16). Docker assegna gli IP in ordine: il gateway (docker0) ottiene
  172.17.0.1, ns2 ottiene 172.17.0.2, ns3 ottiene 172.17.0.3. La comunicazione tra i
  container avviene tramite il bridge virtuale Linux (veth pairs + bridge networking).

- Il volume "../RETI2425/DockerHTTPS:/var/www/html" e' un bind mount: la directory
  dell'host viene montata direttamente nel filesystem del container. Le modifiche sono
  bidirezionali e immediate (non c'e' copia, e' lo stesso inode).
[/Analisi]


# Utilizzeremo ns3 come server HTTPS e ns2 come client. Verificare gli indirizzi dinamici assegnati a ns2 e ns3.
# Configuriamo il Virtual Host su ns3:

> docker exec -it ns3 bash
root@ns3:/#


> root@ns3:/# ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
7: eth0@if8: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
    link/ether 02:42:ac:11:00:03 brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 172.17.0.3/16 brd 172.17.255.255 scope global eth0
       valid_lft forever preferred_lft forever

[Analisi a basso livello]
L'output di "ip a" rivela la configurazione di rete del container ns3:

- lo (loopback): interfaccia virtuale interna al container (127.0.0.1/8 per IPv4, ::1/128
  per IPv6). Ogni network namespace Linux ha il proprio loopback isolato.

- eth0@if8: interfaccia di rete del container. Il suffisso "@if8" indica che e' un'estremita'
  di una coppia veth (virtual ethernet). L'indice 8 si riferisce all'interfaccia peer
  sull'host (visibile con "ip link" sull'host). Le coppie veth funzionano come un tubo:
  tutto cio' che entra da un lato esce dall'altro.

- MAC 02:42:ac:11:00:03: indirizzo MAC generato da Docker. Il prefisso 02:42 e' il vendor
  prefix di Docker (02 indica un indirizzo localmente amministrato, bit U/L = 1). I byte
  successivi (ac:11:00:03) corrispondono alla rappresentazione esadecimale dell'IP
  172.17.0.3 (ac = 172, 11 = 17, 00 = 0, 03 = 3).

- /16 brd 172.17.255.255: la subnet mask /16 indica che i primi 16 bit (172.17) sono la
  parte di rete, i restanti 16 bit sono la parte host, per un totale di 65534 indirizzi
  utilizzabili. L'indirizzo di broadcast 172.17.255.255 viene usato per le comunicazioni
  a tutti gli host della rete.
[/Analisi]


	------------------------------------------------------------
		Creazione del certificato self-signed
	------------------------------------------------------------

# Creare con OpenSSL un certificato server self-signed.
#
# Il certificato X.509 contiene: Subject (chi e' il titolare), Issuer (chi ha firmato
# il certificato), chiave pubblica, periodo di validita', firma digitale dell'issuer.
#
# Self-signed: Subject == Issuer, il certificato firma se stesso. Non c'e' una CA
# (Certificate Authority) di terze parti a garantire l'identita' -> i browser e i
# client non lo accettano di default.
#
# I campi del certificato:
#   CN (Common Name) = 172.17.0.3 (dovrebbe essere il FQDN del server, ma qui usiamo l'IP)
#   O (Organization) = UniPR
#   OU (Organizational Unit) = Corso RETI
#
# RSA 4096 bit: dimensione della chiave asimmetrica nel certificato, piu' sicura dei
# 2048 bit standard. La sicurezza equivalente in bit simmetrici e' circa 140 bit (vs
# 112 bit per RSA 2048).
#
# -nodes (No DES): la chiave privata non viene cifrata con una passphrase -> chiunque
# legga il file puo' usarla (rischio se il file system e' compromesso).
#
# SHA-256: algoritmo di hash usato per la firma del certificato (x509 -sha256).
# Sostituisce SHA-1, ormai considerato insicuro per collisioni dimostrate (SHAttered, 2017).

> root@ns3:/var/www/html# mkdir /etc/nginx/certificate

> root@ns3:/var/www/html# cd /etc/nginx/certificate

> root@ns3:/etc/nginx/certificate# openssl req -new -newkey rsa:4096 -x509 -sha256 -days 365 -nodes -out nginx-certificate.crt -keyout nginx.key
...+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*.+.....+.+...+..+.............+..+....+...+......+..+....+........+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*....+...+......+......+...................+.........+......+.........+...+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
.+.....+.............+..+.+.....+.+...+..+...+.+......+.....+.+........+......+.+..+................+...........+...+.+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*............+....+..+...+........................+.+..+....+...+...+..+...+.........+.+...+......+......+..+.+.....+......+.+..+......+....+...+.....+...+.......+..+.+..+.........+...+.......+........+.+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*..............+......+.......+..+...+.......+...+.................+.+..+.+..+....+.........+............+........+.........+.+......+.....+................+.........+......+...+..+...+...................+..+...+...+...............+..........+...+......+.........+......+.....+......+.......+..+.........+.......+...+.....................+........+..........+...+..+.+......+........+.+............+.........+...........+...+.........+.......+........+.+.........+......+..+.......+..+...+...............+............+......+....+......+.....+.........+...+.......+.........+..+............+...+....+..............+.+......+............+.................+....+..+...+...................+.....+......+....+...+..+.+......+......+..............+.........+....+........+...+...............+............+.......+........+...+...............+......+.....................+...+....+..+..........+.........+..+..........+...+..+.......+..+..........+...............+.....+................+........+............+....+...+..+...................+...........+......+...+..........+.........+..+...+...............+.+......+......+..+......+....+...........+....+...+.........+...+........+...+.......+...............+.........+.....+..........+......+.......................+....+...+..+...+...........................+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
-----
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:IT
State or Province Name (full name) [Some-State]:Parma
Locality Name (eg, city) []:
Organization Name (eg, company) [Internet Widgits Pty Ltd]:UniPR
Organizational Unit Name (eg, section) []:Corso RETI
Common Name (e.g. server FQDN or YOUR name) []:172.17.0.3
Email Address []:nicholas.arcari@studenti.unipr.it

[Analisi a basso livello]
Il comando openssl esegue le seguenti operazioni a basso livello:

1. Generazione della chiave RSA 4096 bit (-newkey rsa:4096):
   - OpenSSL genera due numeri primi casuali p e q di circa 2048 bit ciascuno, usando
     /dev/urandom come sorgente di entropia (CSPRNG del kernel Linux).
   - I caratteri "+", "." e "*" nell'output rappresentano il progresso del test di
     primalita' di Miller-Rabin: "+" indica un numero primo candidato trovato, "."
     indica un test superato, "*" indica un candidato scartato.
   - Calcola n = p * q (modulo RSA, 4096 bit), e = 65537 (esponente pubblico, standard),
     d = e^(-1) mod phi(n) (esponente privato, tramite algoritmo esteso di Euclide).
   - La chiave privata (nginx.key) contiene: n, e, d, p, q, dp, dq, qinv in formato PEM
     (base64 di una struttura ASN.1 DER).

2. Creazione della CSR e firma (-new -x509):
   - Crea una Certificate Signing Request (CSR) con il Distinguished Name inserito
     dall'utente (C=IT, ST=Parma, O=UniPR, OU=Corso RETI, CN=172.17.0.3).
   - Poiche' -x509 e' specificato, firma direttamente il certificato senza passare
     per una CA esterna (self-signed).
   - La firma: calcola SHA-256(DER_encoded_TBSCertificate), poi cifra l'hash con la
     chiave privata RSA -> firma = hash^d mod n. Chiunque possieda la chiave pubblica
     puo' verificare: firma^e mod n == SHA-256(certificato).

3. Output:
   - nginx-certificate.crt: certificato X.509v3 in formato PEM, contiene la chiave
     pubblica, il Distinguished Name, la validita' (365 giorni), e la firma.
   - nginx.key: chiave privata RSA in chiaro (-nodes), formato PEM. Permessi
     consigliati: chmod 600 (solo il proprietario puo' leggere).
[/Analisi]


> root@ns3:/etc/nginx/certificate# more nginx-certificate.crt
-----BEGIN CERTIFICATE-----
MIIF9TCCA92gAwIBAgIUUtu4G0mkGE5OvwYYiRc9OP14l/8wDQYJKoZIhvcNAQEL
BQAwgYkxCzAJBgNVBAYTAklUMQ4wDAYDVQQIDAVQYXJtYTEOMAwGA1UECgwFVW5p
UFIxEzARBgNVBAsMCkNvcnNvIFJFVEkxEzARBgNVBAMMCjE3Mi4xNy4wLjMxMDAu
BgkqhkiG9w0BCQEWIW5pY2hvbGFzLmFyY2FyaUBzdHVkZW50aS51bmlwci5pdDAe
Fw0yNDEyMDcxODM3MDVaFw0yNTEyMDcxODM3MDVaMIGJMQswCQYDVQQGEwJJVDEO
MAwGA1UECAwFUGFybWExDjAMBgNVBAoMBVVuaVBSMRMwEQYDVQQLDApDb3JzbyBS
RVRJMRMwEQYDVQQDDAoxNzIuMTcuMC4zMTAwLgYJKoZIhvcNAQkBFiFuaWNob2xh
cy5hcmNhcmlAc3R1ZGVudGkudW5pcHIuaXQwggIiMA0GCSqGSIb3DQEBAQUAA4IC
DwAwggIKAoICAQChdmlOH1Jz3cjeYkd8fIgckMlXtRtxwoFbvWSYxOfqr7/9XES8
FdvpV7r9UHy0haBp4dXT1JEwar7/gvHA6vLHlD4Mx3siamPqgXtQVRq2BSswB4W0
rtVN8N1EPVUP6mzhrAmLdvx2zgb/K/JsKMPGYYfnxxMOUx2DCfwtOtKPFJLu7Nt8
f7CEzJECXNddiYN0TQhNwRdnjjFZmCs51oZAo8gkXWU28AjNRCkHLZq98JSonQNv
OpiZcM7gywmqu8h+rgG8hbNTkln4iYmxkyAZk9sd6S2E7Oikd7ucaxXBE/MFXQfO
lXkigfwzCQckSL4Q8enHuhSvq4ybQuEm/AgG0oBdZoQ69v6nZOQVnryIigSQJ4Mf
dNStxyvUk2djZbLqdivCLTcLNdPm1rxuYVvuwnxpSWtSIRTiBtb+ZmDIv4iRMBzU
lSILsvVDn8MSnu5uq2IYbry1VVAro4EqlUhVcGw4wWeunyrAw6ICckzu2Lk4HWdr
M80nxsegYdMEwvKPv8P3b9KjrphrAMvv7ZhnYfzqSR9lFBR9lPFn0+izWnHqskHJ
8Yd6nnWuPjvb29I6e7ctQVYd8tUCAcgOTocmH0eNm6thRwp4Ck/45XUdj2wn0AZH
vks2qQSqYSQ/it6hVshO9xZm6X1HTmoclr8sDauuuQ2qjUGum801OVtUuwIDAQAB
o1MwUTAdBgNVHQ4EFgQUzGoo+ghEAJYzr2EOpSnAvdKxekkwHwYDVR0jBBgwFoAU
zGoo+ghEAJYzr2EOpSnAvdKxekkwDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0B
AQsFAAOCAgEAk6H9wERP+fXI9DbX4kdFbNjC/U949fncvSy7vrsyuODzaFINIkAR
iGkBCdO4e7iMg5veaJJG9O5z5V3rKtqoV6V0gMc59QMjUvE7xTW4kcpMI3DEUR3x
dJiUDLtLtCmWRHqn22PqAav5g39RvuEb6EY9VCaUgpytVl4Ml2VExGj6OgADNrQB
snTlBV/LL/SAm1EAc1+5TNdua6Kx78RKy2l48sYqFQYj7kh0dud/226l9lNvaRwr
TeZol7qqVRQknfLEhejG3aFULsnrF3IZvhKfb4ytGxtqq1Pg5Oed59sDfCcCG5JJ
zFcueJ97aQXh5L2Pv773bkDeTC+Gr/KAE9E4DfzAZoKzRzDGenexe8edBlRZu5mp
QWszF6+t7y5O6XkNFcqtOMEUgDeGAl9qIzcaNbPMomPD+CsIO4idPmk1K6rhiL2D
xPCa6xNuB9nbPkp0HhbKD0G6EzBAfO7S75vaOGyT9eu0bPFGYKl4zyjWeClaP2q9
juC5HohpIWx29mCcNTFhssJ5oo+Eg/70WKXD23nB1au7HfgMgR/gu1TL56kbTaDi
IhQ1AxzVuuTnUWJAhRWX+H9bS6eIuAixcvBxuQOKuHYzM4juHxhux/c3dDL3k915
gB8JGvDLCCTdplEbXajj+JK7t90nY3donT8yljp7QCFlGjpbYolVwmM=
-----END CERTIFICATE-----

[Analisi a basso livello]
Il certificato in formato PEM e' una codifica base64 di una struttura ASN.1 DER (Distinguished
Encoding Rules). Decodificando il contenuto:

- La sequenza iniziale "MIIF9TCCA92g..." contiene l'header ASN.1 con la versione (v3),
  il numero seriale univoco, e l'algoritmo di firma (sha256WithRSAEncryption, OID
  1.2.840.113549.1.1.11, identificato da "BQAwgYk...").
- I campi Issuer e Subject sono identici (self-signed): C=IT, ST=Parma, O=UniPR,
  OU=Corso RETI, CN=172.17.0.3, emailAddress=nicholas.arcari@studenti.unipr.it.
- Il periodo di validita': Not Before = 2024-12-07T18:37:05Z, Not After =
  2025-12-07T18:37:05Z (365 giorni esatti).
- La chiave pubblica RSA 4096 bit (SubjectPublicKeyInfo): modulo n di 4096 bit e
  esponente e = 65537 (0x010001).
- Le estensioni X.509v3 includono:
  - SubjectKeyIdentifier (SKI): hash SHA-1 della chiave pubblica per identificazione
  - AuthorityKeyIdentifier (AKI): uguale a SKI (self-signed)
  - BasicConstraints: CA:TRUE (il certificato puo' firmare altri certificati, poiche'
    e' self-signed e funge da root CA per se stesso)
- La firma finale (ultimi ~512 byte base64) e' il risultato di RSA-PKCS1v15(SHA-256(TBS)),
  dove TBS e' la parte "To Be Signed" del certificato.
[/Analisi]


# Vengono generati i file nginx-certificate.crt (certificato) e nginx.key (chiave privata) in formato PEM.
# Visualizzare il Subject del certificato:
> root@ns3:/etc/nginx/certificate# openssl x509 -in nginx-certificate.crt -subject -noout
subject=C = IT, ST = Parma, O = UniPR, OU = Corso RETI, CN = 172.17.0.3, emailAddress = nicholas.arcari@studenti.unipr.it


	------------------------------------------------------------
		Configurazione del Virtual Host NGINX SSL
	------------------------------------------------------------

# Configurazione del Virtual Host in /etc/nginx/sites-available/default.
#
# listen 4443 ssl: NGINX apre un socket TCP sulla porta 4443 e attiva il modulo SSL/TLS;
# il TLS handshake avviene subito dopo il TCP handshake (three-way handshake TCP, poi
# ClientHello TLS).
#
# ssl_certificate e ssl_certificate_key: puntano rispettivamente al certificato pubblico
# (inviato al client durante il handshake) e alla chiave privata (mai trasmessa, usata
# per decifrare il pre-master secret in TLS 1.2, o per firmare il key exchange in TLS 1.3).
#
# La porta 4443 al posto della 443 standard perche':
#   1) Le porte sotto 1024 (well-known ports) richiedono privilegi di root
#   2) Evita conflitto con altri servizi gia' in ascolto sulla porta 443
#   3) Nel compose.yml il port forwarding mappa host:4443 -> container:4443

> root@ns3:/etc/nginx/certificate# cd /etc/nginx/sites-available/
> root@ns3:/etc/nginx/sites-available# nano default
##
# You should look at the following URL's in order to grasp a solid understanding
# of Nginx configuration files in order to fully unleash the power of Nginx.
# https://www.nginx.com/resources/wiki/start/
# https://www.nginx.com/resources/wiki/start/topics/tutorials/config_pitfalls/
# https://wiki.debian.org/Nginx/DirectoryStructure
#
# In most cases, administrators will remove this file from sites-enabled/ and
# leave it as reference inside of sites-available where it will continue to be
# updated by the nginx packaging team.
#
# This file will automatically load configuration files provided by other
# applications, such as Drupal or Wordpress. These applications will be made
# available underneath a path with that package name, such as /drupal8.
#
# Please see /usr/share/doc/nginx-doc/examples/ for more detailed examples.
##

# Default server configuration
#
server {
        listen 80 default_server;
        listen [::]:80 default_server;

        # SSL configuration
        #
        # listen 443 ssl default_server;
        # listen [::]:443 ssl default_server;
        #
        # Note: You should disable gzip for SSL traffic.
        # See: https://bugs.debian.org/773332
        #
        # Read up on ssl_ciphers to ensure a secure configuration.
        # See: https://bugs.debian.org/765782
        #
        # Self signed certs generated by the ssl-cert package
        # Don't use them in a production server!
        #
        # include snippets/snakeoil.conf;

        root /var/www/html;

        # Add index.php to the list if you are using PHP
        index index.html index.htm index.nginx-debian.html;

        server_name _;

        location / {
                # First attempt to serve request as file, then
                # as directory, then fall back to displaying a 404.
                try_files $uri $uri/ =404;
        }

        # pass PHP scripts to FastCGI server
        #
        #location ~ \\.php$ {
        #       include snippets/fastcgi-php.conf;
        #
        #       # With php-fpm (or other unix sockets):
        #       fastcgi_pass unix:/run/php/php7.4-fpm.sock;
        #       # With php-cgi (or other tcp sockets):
        #       fastcgi_pass 127.0.0.1:9000;
        #}

        # deny access to .htaccess files, if Apache's document root
        # concurs with nginx's one
        #
        #location ~ /\\.ht {
        #       deny all;
        #}
}


# Virtual Host configuration for example.com
#
# You can move that to a different file under sites-available/ and symlink that
# to sites-enabled/ to enable it.
#
#server {
#       listen 80;
#       listen [::]:80;
#
#       server_name example.com;
#
#       root /var/www/example.com;
#       index index.html;
#
#       location / {
#               try_files $uri $uri/ =404;
#       }
#}

server {
        listen 4443 ssl default_server;
        listen [::]:4443 ssl default_server;
        ssl_certificate /etc/nginx/certificate/nginx-certificate.crt;
        ssl_certificate_key /etc/nginx/certificate/nginx.key;
        root /var/www/html;
        index index.html index.htm index.nginx-debian.html;
        server_name _;
        location / {
                try_files $uri $uri/ =404;
        }
}

[Analisi a basso livello]
La configurazione NGINX definisce due blocchi server (Virtual Host):

1. Server HTTP (porta 80):
   - listen 80 default_server: crea un socket con socket(), bind(0.0.0.0:80), listen().
     "default_server" indica che questo blocco gestisce le richieste che non corrispondono
     a nessun altro server_name. Il flag [::]:80 crea un secondo socket per IPv6.
   - server_name _: wildcard che non corrisponde a nessun hostname reale; poiche' e'
     default_server, cattura tutto il traffico sulla porta 80.
   - try_files $uri $uri/ =404: NGINX cerca prima un file corrispondente all'URI, poi
     una directory, e infine restituisce HTTP 404. Questo evita di esporre il directory
     listing (che sarebbe un rischio di information disclosure).

2. Server HTTPS (porta 4443):
   - listen 4443 ssl: il flag "ssl" attiva il modulo ngx_http_ssl_module. Internamente
     NGINX chiama SSL_CTX_new() per creare un contesto OpenSSL, poi SSL_CTX_use_certificate_file()
     e SSL_CTX_use_PrivateKey_file() per caricare il certificato e la chiave.
   - Quando un client si connette, NGINX esegue SSL_accept() che gestisce tutto il TLS
     handshake. Solo dopo il completamento del handshake, NGINX legge la richiesta HTTP
     in chiaro dal buffer SSL.
   - La direttiva ssl_certificate carica il certificato in memoria al reload di NGINX;
     ssl_certificate_key carica la chiave privata. NGINX verifica che la chiave privata
     corrisponda al certificato (SSL_CTX_check_private_key()) durante il caricamento.
   - Nota: mancano direttive di hardening consigliate come ssl_protocols (per disabilitare
     TLS 1.0/1.1), ssl_ciphers (per scegliere solo cifrari sicuri), ssl_prefer_server_ciphers,
     e server_tokens off (per nascondere la versione di NGINX).
[/Analisi]


# Riavviare NGINX e verificare che il servizio e' attivo:
> root@ns3:/etc/nginx/sites-available# service nginx reload
 * Reloading nginx configuration nginx                                                                                                                                                                 [ OK ]


> root@ns3:/etc/nginx/sites-available# netstat -tupan
Active Internet connections (servers and established)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      1/nginx: master pro
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      13/sshd: /usr/sbin/
tcp        0      0 0.0.0.0:4443            0.0.0.0:*               LISTEN      1/nginx: master pro		# a noi interessa la porta 4443
tcp6       0      0 :::80                   :::*                    LISTEN      1/nginx: master pro
tcp6       0      0 :::22                   :::*                    LISTEN      13/sshd: /usr/sbin/
tcp6       0      0 :::4443                 :::*                    LISTEN      1/nginx: master pro

[Analisi a basso livello]
L'output di netstat -tupan mostra tutti i socket TCP/UDP in stato LISTEN e le connessioni
attive, con il PID e il nome del processo associato:

- NGINX (PID 1, "master pro"): il processo master e' il primo processo avviato nel container
  (PID 1, corrispondente all'ENTRYPOINT del Dockerfile). Ascolta su tre porte:
  - 0.0.0.0:80 (HTTP IPv4) e :::80 (HTTP IPv6): server HTTP standard
  - 0.0.0.0:4443 (HTTPS IPv4) e :::4443 (HTTPS IPv6): server HTTPS configurato
  L'indirizzo 0.0.0.0 (INADDR_ANY) indica che accetta connessioni su qualsiasi interfaccia
  di rete. Il processo master NGINX gestisce la configurazione e i processi worker; sono i
  worker (non visibili qui perche' non hanno socket propri, ereditano quelli del master)
  che gestiscono le richieste HTTP/HTTPS effettive.

- SSHD (PID 13): il demone OpenSSH in ascolto sulla porta 22 su tutte le interfacce
  (0.0.0.0:22 e :::22). E' il secondo servizio avviato nel container. La porta 22 non
  e' esposta all'host (nessun port forwarding nel compose.yml per la porta 22 di ns3),
  quindi e' raggiungibile solo dall'interno della rete Docker bridge.

- Recv-Q e Send-Q a 0: nessun dato in attesa nei buffer del kernel, i socket sono in
  attesa passiva di connessioni (stato LISTEN).
[/Analisi]




	-----------------------------
		Client HTTPS
	-----------------------------

# Accedere al server HTTPS con wget e/o curl da ns2 da un altro terminale.
#
# --no-check-certificate (wget) e --insecure (curl): disabilitano la verifica del certificato
# server. In produzione questo e' PERICOLOSISSIMO: permette attacchi Man-in-the-Middle (MITM),
# dove un attaccante si interpone e presenta il proprio certificato fraudolento.
#
# Il WARNING "Self-signed certificate encountered": il client non trova il certificato nella
# sua trust store (lista di CA fidate in /etc/ssl/certs/).
#
# Per verificare correttamente un certificato self-signed: copiare il certificato nel client
# e usare --cacert nginx-certificate.crt con curl, oppure --ca-certificate con wget.

> docker exec -it ns2 bash
root@ns2:/#


> root@ns2:/# ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
5: eth0@if6: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
    link/ether 02:42:ac:11:00:02 brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 172.17.0.2/16 brd 172.17.255.255 scope global eth0
       valid_lft forever preferred_lft forever


# Il client dovrebbe verificare il certificato del server, ma nel nostro caso il certificato self-signed non puo' essere verificato, quindi occorre dichiarare esplicitamente che la connessione e' ammessa senza verifica.
# Esempi:

> root@ns2:/var/www/html# nmap 172.17.0.3
Starting Nmap 7.93 ( https://nmap.org ) at 2024-12-07 18:50 UTC
Nmap scan report for 172.17.0.3
Host is up (0.000015s latency).
Not shown: 997 closed tcp ports (reset)
PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
4443/tcp open  pharos
MAC Address: 02:42:AC:11:00:03 (Unknown)

Nmap done: 1 IP address (1 host up) scanned in 1.53 seconds

[Analisi a basso livello]
La scansione nmap del server ns3 rivela 3 porte aperte su 1000 scansionate:

- 22/tcp (SSH): il demone OpenSSH in ascolto, consente l'accesso remoto al container.
- 80/tcp (HTTP): NGINX in ascolto per le richieste HTTP in chiaro.
- 4443/tcp (pharos): NGINX in ascolto per le richieste HTTPS. Nmap identifica il servizio
  come "pharos" perche' consulta il suo database /usr/share/nmap/nmap-services che associa
  la porta 4443 al protocollo Pharos. In realta' si tratta del nostro server HTTPS; per
  identificare correttamente il servizio si dovrebbe usare nmap -sV (version detection)
  che invia probe specifiche e analizza le risposte.

- "997 closed tcp ports (reset)": le restanti porte hanno risposto con un pacchetto TCP RST
  (Reset), indicando che nessun processo e' in ascolto. A differenza di "filtered" (nessuna
  risposta, indica un firewall), "closed" conferma che l'host e' raggiungibile ma non offre
  servizi su quelle porte.

- La latenza di 0.000015s (15 microsecondi) e' estremamente bassa perche' la comunicazione
  avviene interamente attraverso il bridge virtuale di Docker, senza attraversare alcuna
  interfaccia di rete fisica. I pacchetti passano direttamente tra le veth pair nel kernel.
[/Analisi]


> root@ns2:/var/www/html# wget https://172.17.0.3:4443/index.html --no-check-certificate
--2024-12-07 18:53:10--  https://172.17.0.3:4443/index.html
Connecting to 172.17.0.3:4443... connected.
WARNING: cannot verify 172.17.0.3's certificate, issued by 'emailAddress=nicholas.arcari@studenti.unipr.it,CN=172.17.0.3,OU=Corso RETI,O=UniPR,ST=Parma,C=IT':
  Self-signed certificate encountered.
HTTP request sent, awaiting response... 200 OK
Length: 19 [text/html]
Saving to: 'index.html.1'

index.html.1                                            [ <================================================================> ]       19  --.-KB/s    in 0s

2024-12-07 18:53:10 (3.88 MB/s) - 'index.html.1' saved [19/19]

[Analisi a basso livello]
Il flusso di wget con --no-check-certificate procede cosi':

1. Risoluzione DNS: wget tenta di risolvere 172.17.0.3 ma, essendo gia' un indirizzo IP,
   salta questo passaggio.

2. Connessione TCP: wget esegue connect() verso 172.17.0.3:4443. Il three-way handshake
   TCP (SYN -> SYN-ACK -> ACK) viene completato ("connected.").

3. TLS Handshake:
   - Il client invia ClientHello con la lista delle cipher suites supportate e un random
     di 32 byte.
   - Il server risponde con ServerHello (scelta della cipher suite), invia il certificato
     (il nostro self-signed) e completa il suo lato del handshake.
   - Il client riceve il certificato e tenta la verifica: cerca l'Issuer nella trust store
     (/etc/ssl/certs/ca-certificates.crt), non lo trova, e genera il WARNING. Con
     --no-check-certificate, il client ignora l'errore e prosegue comunque.
   - Il client invia il ClientKeyExchange (pre-master secret cifrato con la chiave pubblica
     del server), poi ChangeCipherSpec e Finished.
   - Il server decifra il pre-master secret con la chiave privata, entrambi derivano la
     master secret e le chiavi simmetriche di sessione (AES-256-GCM tipicamente).

4. Richiesta HTTP (cifrata): wget invia "GET /index.html HTTP/1.1" attraverso il canale
   TLS. NGINX legge la richiesta dal buffer SSL, serve il file (19 byte), e il client lo
   salva come "index.html.1" (perche' index.html esiste gia' nella directory corrente).
[/Analisi]


> curl --insecure https://172.17.0.3:4443/index.html
virtual host HTTPS


> root@ns2:/var/www/html# curl -I  --insecure https://172.17.0.3:4443/index.html
HTTP/1.1 200 OK
Server: nginx/1.22.0 (Ubuntu)
Date: Sat, 07 Dec 2024 18:56:40 GMT
Content-Type: text/html
Content-Length: 0
Last-Modified: Sat, 07 Dec 2024 18:53:03 GMT
Connection: keep-alive
ETag: "6754998f-0"
Accept-Ranges: bytes

[Analisi a basso livello]
L'opzione -I di curl invia una richiesta HTTP HEAD (invece di GET): il server risponde
solo con gli header, senza il body. Questo e' utile per verificare la raggiungibilita'
del server e i metadati della risorsa senza scaricare il contenuto.

Analisi degli header di risposta:
- Server: nginx/1.22.0 (Ubuntu): INFORMATION LEAKAGE. Questo header rivela la versione
  esatta del web server. Un attaccante puo' cercare CVE specifiche per NGINX 1.22.0
  (ad esempio vulnerabilita' di HTTP/2 come CVE-2023-44487 "HTTP/2 Rapid Reset").
  Best practice: aggiungere "server_tokens off;" nel blocco http{} di /etc/nginx/nginx.conf
  per nascondere la versione (l'header mostrerebbe solo "nginx").

- Content-Length: 0: sembra anomalo poiche' la richiesta GET precedente ha restituito
  "virtual host HTTPS" (19 byte). Questo valore 0 nella risposta HEAD potrebbe indicare
  che il file e' stato sovrascritto dal wget precedente (che ha scaricato una copia
  vuota sovrascrivendo l'originale nel bind mount condiviso).

- ETag: "6754998f-0": identificatore univoco della risorsa basato su timestamp e
  dimensione. "6754998f" e' il timestamp Unix in esadecimale (07 Dec 2024 18:53:03 UTC),
  "-0" e' la dimensione del file.

- Connection: keep-alive: il server mantiene la connessione TCP aperta per richieste
  successive (HTTP/1.1 persistent connection), evitando l'overhead di un nuovo TCP
  handshake e TLS handshake per ogni richiesta.

- Accept-Ranges: bytes: il server supporta le richieste Range (download parziale),
  utile per il resume di download interrotti.
[/Analisi]


# Il programma https_client_transp.py utilizza il modulo ssl che consente la programmazione SSL a livello trasporto, mentre il programma https_client_appl.py utilizza il modulo Python
# http.client, utilizzato anche per la connessione HTTP, per la programmazione a livello applicazione.
#
# Il programma https_client_transp.py usa il modulo ssl di Python che wrappa OpenSSL;
# crea un SSLContext, disabilita la verifica del certificato (ssl.CERT_NONE, equivalente
# a --insecure), e poi fa wrap_socket() sul socket TCP per aggiungere il layer TLS.
# La catena di chiamate e': socket.socket() -> ssl.SSLContext() -> ctx.wrap_socket(sock)
# -> sock.connect() -> sock.send(HTTP_request) -> sock.recv(response).

> root@ns2:/var/www/html# python3 https_client_transp.py -s 172.17.0.3 -p 4443
 server: 172.17.0.3 port: 4443  url: /index.html
Status: 200 and reason: OK
virtual host HTTPS

[Analisi a basso livello]
Il programma Python https_client_transp.py opera a livello trasporto:

1. Crea un socket TCP grezzo con socket.socket(AF_INET, SOCK_STREAM).
2. Crea un SSLContext con ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT) o equivalente.
3. Disabilita la verifica del certificato: ctx.check_hostname = False e
   ctx.verify_mode = ssl.CERT_NONE. Questo e' l'equivalente programmatico di
   --insecure di curl. In produzione, si dovrebbe usare ssl.CERT_REQUIRED e
   caricare il certificato CA con ctx.load_verify_locations('ca.crt').
4. Esegue ctx.wrap_socket(sock, server_hostname='172.17.0.3') che:
   - Incapsula il socket TCP in un oggetto SSLSocket
   - Avvia il TLS handshake (internamente chiama SSL_do_handshake() di OpenSSL)
   - Negozia la cipher suite e le chiavi di sessione
5. Costruisce manualmente la richiesta HTTP: "GET /index.html HTTP/1.1\\r\\nHost: ...\\r\\n\\r\\n"
   e la invia tramite ssl_sock.send(). La libreria OpenSSL cifra i dati prima di passarli
   al socket TCP sottostante.
6. Riceve la risposta con ssl_sock.recv(), OpenSSL la decifra, e il programma fa il parsing
   degli header HTTP per estrarre lo status code (200) e il body ("virtual host HTTPS").

La differenza rispetto a https_client_appl.py e' che quest'ultimo usa
http.client.HTTPSConnection che astrae tutti questi passaggi: crea automaticamente il
socket, il contesto SSL, fa il wrap, e fornisce metodi ad alto livello come
conn.request('GET', '/index.html') e conn.getresponse().
[/Analisi]


# Adesso apriamo il browser (nel mio caso Chrome) e digitiamo il seguente URL nella barra di ricerca: https://localhost:4443/index.html
#
# Kaspersky che blocca la pagina: l'antivirus fa SSL inspection (MITM "legittimo"),
# installa un proprio certificato CA root sulla macchina e ri-cifra il traffico TLS.
# Quando incontra un certificato self-signed, lo rifiuta per proteggere l'utente.
# In pratica, il flusso e':
#   Browser -> TLS con certificato Kaspersky -> Kaspersky proxy -> TLS con certificato
#   server -> Server NGINX
# Kaspersky intercetta, decifra, analizza il traffico per malware, e lo ri-cifra verso
# il browser usando il proprio certificato CA (installato come trusted nel sistema).
# Quando il certificato del server e' self-signed, Kaspersky lo considera non affidabile
# e blocca la connessione mostrando una pagina di avviso.
#
# L'antivirus Kaspersky (a pagamento) non mi fa proseguire in questa pagina in quanto la sicurezza e' troppo bassa;
# dovrebbe pero' apparire a schermo la scritta "virtual host HTTPS"

> root@ns2:/var/www/html# exit
exit

> docker-compose down
[+] Running 2/2
 ✔ Container ns3  Removed                                                                                                                                                                                0.7s
 ✔ Container ns2  Removed                                                                                                                                                                                0.6s
`;export{e as default};
