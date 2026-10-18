const e=`@banner
  _           _                     _             _                      ______      _
 | |         | |                   | |           (_)                    |  ____|    | |
 | |     __ _| |__   ___  _ __ __ _| |_ ___  _ __ _  ___      ______    | |__  __  _| |_ _ __ __ _
 | |    / _\` | '_ \\ / _ \\| '__/ _\` | __/ _ \\| '__| |/ _ \\    |______|   |  __| \\ \\/ / __| '__/ _\` |
 | |___| (_| | |_) | (_) | | | (_| | || (_) | |  | | (_) |              | |____ >  <| |_| | | (_| |
 |______\\__,_|_.__/ \\___/|_|  \\__,_|\\__\\___/|_|  |_|\\___/               |______/_/\\_\\\\__|_|  \\__,_|
@end

@analysis Introduzione al WiFi
IEEE 802.11: standard per le reti wireless LAN (WLAN).

Architettura WiFi:

- Access Point (AP): dispositivo che crea una BSS (Basic Service Set), cioe' una rete wireless.
- SSID (Service Set Identifier): nome della rete visibile dagli utenti (es. "xxxx" del professore).
- BSSID (Basic Service Set Identifier): indirizzo MAC dell'AP, identifica univocamente la rete a livello L2.
- Canale: frequenza radio usata (2.4 GHz: canali 1-13, 5 GHz: canali 36-165, 6 GHz: WiFi 6E).

Processo di connessione:

1. Scanning: il client invia Probe Request o ascolta Beacon Frame dell'AP (trasmessi ogni ~100ms).
2. Authentication: scambio di frame di autenticazione (Open System o Shared Key).
3. Association: il client si associa all'AP (Association Request/Response).
4. 4-Way Handshake (WPA2-PSK): deriva la PTK (Pairwise Transient Key) dalla PSK (Pre-Shared Key),
   dagli indirizzi MAC di client e AP, e da due nonce casuali. La PTK cifra il traffico unicast.

Sicurezza WiFi:

- WEP: deprecato, crackabile in minuti con aircrack-ng (IV di 24 bit, RC4 debole).
- WPA2-PSK (AES-CCMP): standard attuale, sicuro se la password e' forte (>12 caratteri).
- WPA3-SAE: usa Simultaneous Authentication of Equals (Dragonfly handshake), resistente ad attacchi
  offline dictionary e KRACK. Non ancora universalmente supportato.
@end

# Durante il laboratorio e' stato acceso un Access Point WiFi isolato con SSID "xxxx" e pass "xxxxxxxxxx".

# Attivare il compose IPStatico. L'host esporra' le porte con port-forwarding del container: 20xx (ssh) e 80xx (nginx).

# Dopo essermi collegato al router del professore, eseguendo il comando \`ifconfig\` oppure \`ip a\` ho notato che il mio dispositivo aveva ip dinamico: 192.168.1.106

# Inoltre mi preme informare che tutti i comandi sottostanti sono stati eseguiti non da Docker, bensi' da shell		-->	  purtroppo ho dovuto formattare il SO Kali Linux (per l'ennesima volta -.-) causa problemi di provenienza ignota, per il giorno del laboratorio non sono riuscito in tempo a re-impostare il docker ns11 come fatto per il laboratorio 3-IPstatico.

@analysis
L'indirizzo 192.168.1.106 e' stato assegnato dal DHCP server (integrato nel router/AP del professore):

- DHCP (Dynamic Host Configuration Protocol): il client invia un DHCPDISCOVER in broadcast (255.255.255.255),
  il server risponde con un DHCPOFFER contenente IP, subnet mask, gateway e DNS.
- La rete 192.168.1.0/24 e' una rete privata (RFC 1918), non routabile su Internet.
- Il router del professore fa NAT (Network Address Translation) per dare accesso a Internet ai dispositivi.

Ogni studente ha un IP diverso nella stessa /24 (max 254 dispositivi). La convenzione del corso:

- Porta 20xx per SSH (es. 2006 per lo studente numero 6)
- Porta 80xx per HTTP (es. 8006 per lo studente numero 6)

Questo permette a tutti gli studenti di esporre i propri servizi Docker sulla rete WiFi condivisa
senza conflitti di porta (ciascuno ha le proprie porte univoche).
@end

# Scansione della rete con nmap del dispositivo del professore:

@term
$ > nmap 192.168.1.100
| Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-10-15 16:25 CEST
| Nmap scan report for 192.168.1.100
| Host is up (0.0037s latency).
| Not shown: 997 filtered tcp ports (no-response)
| PORT     STATE SERVICE
| 2968/tcp open  enpp
| 6000/tcp open  X11
| 8011/tcp open  unknown
| MAC Address: xx:xx:xx:xx:xx:xx (Bizlink Technology)
|
| Nmap done: 1 IP address (1 host up) scanned in 23.48 seconds
@end

@analysis
Analisi dell'output nmap:

- Latenza 0.0037s (3.7 ms): tipica di una connessione WiFi locale (molto piu' alta rispetto
  ai ~0.1 ms visti tra container Docker sullo stesso host, a causa del mezzo radio).

- 997 porte "filtered" (no-response): indica che il firewall del computer del professore (Windows Firewall)
  droppa silenziosamente i pacchetti SYN su queste porte senza inviare RST.
  Il termine "filtered" in nmap significa: nmap non riesce a determinare se la porta e' aperta o chiusa
  perche' non riceve alcuna risposta (ne' SYN-ACK ne' RST).

- 3 porte aperte:
  a) 2968/tcp (enpp): probabilmente un port forwarding del container Docker del professore
     (porta SSH del container mappata su questa porta dell'host).
  b) 6000/tcp (X11): il X Window System in ascolto. RISCHIO DI SICUREZZA: X11 non e' cifrato
     di default. Un attaccante sulla stessa rete puo' potenzialmente:
     - Catturare screenshot dell'intero desktop (xwd).
     - Registrare le digitazioni (xspy, xinput).
     - Iniettare eventi di tastiera/mouse (xdotool).
     Contromisura: usare X11 forwarding su SSH (-X flag) oppure Wayland.
  c) 8011/tcp (unknown): probabile port forwarding per il servizio HTTP del container Docker.
     Nmap lo classifica come "unknown" perche' non ha un servizio noto associato a questa porta.

- MAC Address (Bizlink Technology): identifica il vendor della scheda di rete del computer del professore
  tramite i primi 3 byte (OUI) registrati presso l'IEEE. Il MAC e' visibile perche' il traffico WiFi
  a livello L2 include il MAC del mittente in chiaro (anche su reti WPA2 cifrate).

Nota su nmap: la scansione ha richiesto 23.48 secondi (vs ~2 secondi tra container) a causa dei timeout
necessari per le porte filtrate e della latenza WiFi. In un contesto di penetration testing, si userebbe
nmap con timing aggressivo (-T4) e script NSE (-sC) per enumerare i servizi.
@end

# Scansione della rete con tcpdump del dispositivo del professore (mentre cercava di cambiare impostazioni sul firewall di Windows)

@term
$ > sudo tcpdump -z 192.168.1.100
| tcpdump: verbose output suppressed, use -v[v]... for full protocol decode
| listening on wlan0, link-type EN10MB (Ethernet), snapshot length 262144 bytes
| 16:28:32.992727 IP 192.168.1.103.mdns > 224.0.0.251.mdns: 0 PTR (QM)? 1.1.168.192.in-addr.arpa.local. (48)
| 16:28:32.994895 IP 192.168.1.103.mdns > 224.0.0.251.mdns: 0 PTR (QM)? 6.1.168.192.in-addr.arpa.local. (48)
| 16:28:33.000411 IP 192.168.1.103.mdns > 224.0.0.251.mdns: 0 PTR (QM)? 9.1.168.192.in-addr.arpa.local. (48)
| 16:28:33.004118 IP6 fe80::f064:e391:4b9b:1240.mdns > ff02::fb.mdns: 0 PTR (QM)? 2.1.168.192.in-addr.arpa.local. (48)
| 16:28:33.005444 IP 192.168.1.103.mdns > 224.0.0.251.mdns: 0 PTR (QM)? 4.1.168.192.in-addr.arpa.local. (48)
| 16:28:33.055245 IP 192.168.1.106.51949 > 192.168.1.251.domain: 10662+ PTR? 251.0.0.224.in-addr.arpa. (42)
| 16:28:33.515787 ARP, Request who-has 192.168.1.173 tell 192.168.1.103, length 28
| 16:28:33.527680 ARP, Request who-has 192.168.1.204 tell 192.168.1.103, length 28
| 16:28:33.535174 ARP, Request who-has 192.168.1.231 tell 192.168.1.103, length 28
| ^C
| 9 packets captured
| 3579 packets received by filter
| 3508 packets dropped by kernel
@end

@analysis
Analisi dettagliata del traffico catturato:

tcpdump su wlan0: cattura i frame 802.11 dopo la decifratura WPA2 (il driver WiFi li presenta
gia' decifrati al kernel come frame Ethernet standard, link-type EN10MB).

1. Traffico mDNS (multicast DNS):
   - 192.168.1.103.mdns > 224.0.0.251.mdns: un dispositivo (.103) invia query mDNS.
   - 224.0.0.251 = indirizzo multicast riservato per mDNS (RFC 6762), porta 5353.
   - mDNS: risoluzione dei nomi sulla rete locale SENZA bisogno di un server DNS centralizzato.
     Usato da Bonjour (Apple), Avahi (Linux), Windows Network Discovery.
   - Le query PTR (Pointer Record): reverse DNS lookup, risolvono IP -> nome.
     "1.1.168.192.in-addr.arpa.local" = lookup per 192.168.1.1 (probabilmente il gateway).
   - QM (Query Multicast): la query e' inviata in multicast, tutti i dispositivi sulla rete la ricevono.

2. Traffico IPv6 mDNS:
   - fe80::f064:e391:4b9b:1240 > ff02::fb: stessa query mDNS ma su IPv6.
   - ff02::fb = indirizzo multicast IPv6 per mDNS (equivalente di 224.0.0.251).
   - fe80:: = indirizzo link-local, il dispositivo genera traffico IPv6 anche se la rete usa
     principalmente IPv4 (IPv6 e' sempre attivo per default su sistemi moderni).

3. Query DNS standard:
   - 192.168.1.106 (il nostro PC) > 192.168.1.251 (il DNS resolver/router):
     query PTR per 251.0.0.224.in-addr.arpa = reverse lookup di 224.0.0.251 (indirizzo multicast mDNS).
     Questa query e' generata dal resolver di sistema che cerca di risolvere l'IP mDNS in un nome.

4. Traffico ARP:
   - "ARP, Request who-has 192.168.1.173 tell 192.168.1.103": il dispositivo .103 sta cercando il MAC
     address corrispondente a diversi IP sulla rete (.173, .204, .231).
   - Molti ARP Request per IP diversi in rapida successione: tipico di una scansione di rete (nmap).
     Il dispositivo .103 sta probabilmente eseguendo un host discovery ARP della subnet.
   - ARP Request sono broadcast L2: TUTTI i dispositivi sulla rete li ricevono, anche se non sono
     il destinatario. Questo e' visibile nel tcpdump.

Statistiche:

- "3579 packets received by filter" ma "3508 packets dropped by kernel": il 98% dei pacchetti e'
  stato perso! Causa: il buffer del kernel e' troppo piccolo per la quantita' di traffico sulla rete
  WiFi. Per ridurre le perdite: aumentare il buffer con -B (es. tcpdump -B 4096) oppure usare
  un filtro piu' specifico per catturare solo il traffico rilevante.
@end

# Accesso al docker ns11 (3-IPstatico) al computer MacOS della mia compagna di corso con porta 20

@term
$ > ssh ubuntu@192.168.1.107 -p 2087
| The authenticity of host '[192.168.1.107]:2087 ([192.168.1.107]:2087)' can't be established.
| ED25519 key fingerprint is SHA256:vCr9WGHV+iJ9AvdcI6Jlm5HrdYV3lzkK23PBeuQnMAA.
| This key is not known by any other names.
| Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
| Warning: Permanently added '[192.168.1.107]:2087' (ED25519) to the list of known hosts.
| ubuntu@192.168.1.107's password:
| Permission denied, please try again.
| ubuntu@192.168.1.107's password:
| Welcome to Ubuntu 24.04.1 LTS (GNU/Linux 6.10.0-linuxkit x86_64)
|
|  * Documentation:  https://help.ubuntu.com
|  * Management:     https://landscape.canonical.com
|  * Support:        https://ubuntu.com/pro
|
| This system has been minimized by removing packages and content that are
| not required on a system that users do not log into.
|
| To restore this content, you can run the 'unminimize' command.
| Last login: Sat Oct 12 07:28:47 2024 from 192.168.65.1
| Environment:
|   LANG=C.UTF-8
|   USER=ubuntu
|   LOGNAME=ubuntu
|   HOME=/home/ubuntu
|   PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin
|   SHELL=/bin/bash
|   TZ=UTC
|   TERM=xterm-256color
|   SSH_CLIENT=192.168.65.1 55734 22
|   SSH_CONNECTION=192.168.65.1 55734 172.21.0.87 22
|   SSH_TTY=/dev/pts/1
| ubuntu@ns11:
| ubuntu@ns11:
| ubuntu@ns11: exit
| logout
@end

@analysis
Percorso completo del pacchetto SSH attraverso la rete WiFi e Docker:

1. Il nostro PC (192.168.1.106) invia un pacchetto TCP SYN verso 192.168.1.107:2087 via WiFi.
2. Il frame 802.11 viene cifrato con la PTK derivata dal 4-way handshake WPA2.
3. L'AP decifra e ritrasmette al PC della collega (192.168.1.107) via WiFi.
4. Sul PC della collega, Docker ha configurato una regola iptables DNAT:
   i pacchetti per la porta 2087 vengono reindirizzati a 172.21.0.87:22 (container ns11).
5. Il pacchetto attraversa il bridge Docker e arriva al container via veth pair.

Analisi delle variabili d'ambiente SSH:

- SSH_CLIENT=192.168.65.1 55734 22: l'IP sorgente visto dal container e' 192.168.65.1, NON 192.168.1.106.
  192.168.65.1 e' l'indirizzo del gateway Docker Desktop per Mac (Docker su macOS usa una VM Linux,
  e il traffico dall'host macOS al container passa attraverso l'interfaccia virtuale 192.168.65.0/24).
- SSH_CONNECTION=192.168.65.1 55734 172.21.0.87 22: conferma che il container vede il proprio IP
  come 172.21.0.87 sulla rete bridge1 (172.21.0.0/24).
- La porta 55734 e' una ephemeral port scelta dal kernel del Mac della collega per la connessione.

"Permission denied, please try again" -> "Welcome": il primo tentativo di password e' fallito
(probabilmente errore di digitazione). SSH permette di default 3 tentativi (configurabile con
MaxAuthTries in /etc/ssh/sshd_config).

Il fingerprint ED25519 (SHA256:vCr9WGHV+...) e' DIVERSO da quello visto nelle connessioni precedenti
(SHA256:LB3Ms/...): ogni container genera la propria coppia di chiavi host al primo avvio di sshd.
Questo conferma che il container della collega e' un'istanza diversa.
@end

# Accesso al docker ns11 (3-IPstatico) al computer MacOS della mia compagna di corso con porta 80

@term
$ > curl ubuntu@192.168.1.107:8087/url.html
| <html lang="it"> <head> <meta content="origin" name="referrer">  <script nonce="yJt1euKpBfHw6sVmcByYUA">window.google = {};(function(){
| var d=/^\\s*(?!javascript:)(?:[\\w+.-]+:|[^:/?#]*(?:[/?#]|$))/i;
| (this||self).google.navigateTo=function(a,c,b){!/\\/.*?[&?]gsc=1/.test(c.location.href)&&a!==c&&a.google?a.google.r&&(a.google.r=0,a=a.location,b=d.test(b)?b:void 0,b!==void 0&&(a.href=b),c.location.replace("about:blank")):c.location.replace(b)};}).call(this);(function(){var redirectUrl='http://didatticainfo.altervista.org/Quinta/DataLink.pdf';google.navigateTo(parent,window,redirectUrl);})();<\/script> <noscript> <meta content="0;url=http://didatticainfo.altervista.org/Quinta/DataLink.pdf" http-equiv="refresh"> </noscript> </head>  </html>
@end

@analysis
La risposta HTTP contiene un redirect JavaScript verso un PDF esterno. Questo e' il contenuto del file
url.html ospitato nel container della collega: una pagina HTML che reindirizza automaticamente al PDF
"DataLink.pdf" su altervista.org. Il tag <noscript> fornisce un redirect anche per browser senza JavaScript.

Il nonce "yJt1euKpBfHw6sVmcByYUA" nello script e' un token di sicurezza CSP (Content Security Policy)
che permette l'esecuzione solo di script con quel nonce specifico, proteggendo contro attacchi XSS.
@end

# Accesso al docker ns11 (3-IPstatico) al computer Windows del professore
# non funziona, probabile causa e' che il professore si e' staccato dalla rete senza accorgersene, in quanto il computer si collega in automatico alla rete piu' prestante salvata (probabilmente unipr-wpa), questo e' possibile dal motivo che la sua rete personale (a cui tutti noi avevamo acceduto) era estremamente sotto sforzo

@term
$ > ssh ubuntu@192.168.1.100 -p 2011
| kex_exchange_identification: read: Connection reset by peer
| Connection reset by 192.168.1.100 port 2011
@end

@analysis
Errore "kex_exchange_identification: read: Connection reset by peer":

- Il TCP three-way handshake (SYN, SYN-ACK, ACK) e' completato con successo (la connessione TCP e' stata stabilita).
- Subito dopo, durante la fase KEX (Key Exchange) del protocollo SSH, il server ha inviato un RST
  (Reset) chiudendo abruptamente la connessione.

Possibili cause:

1. Il container Docker sulla porta 2011 non e' in esecuzione: il port forwarding esiste a livello
   iptables, la connessione TCP viene accettata dal docker-proxy, ma non c'e' nessun sshd in ascolto.
2. Il PC del professore si e' disconnesso dalla rete WiFi dell'AP e riconnesso a unipr-wpa: in questo
   caso l'IP 192.168.1.100 potrebbe essere stato riassegnato dal DHCP a un altro dispositivo, oppure
   la connessione raggiunge il PC del professore sulla nuova rete ma con un IP diverso.
3. Il firewall Windows ha bloccato la connessione dopo il TCP handshake (application-level filtering).

La connessione WiFi automatica alla rete "piu' prestante" (signal strength piu' alto o priorita' salvata)
e' un comportamento standard: Windows, macOS e Linux selezionano la rete salvata con il miglior segnale.
Su una rete sotto carico (molti studenti connessi), il throughput scende e il sistema potrebbe preferire
un'altra rete con segnale migliore.
@end

# Scansione della rete con tcpdump del dispositivo della compagna avente MacOS

@term
$ > sudo tcpdump -z 192.168.1.107
| tcpdump: verbose output suppressed, use -v[v]... for full protocol decode
| listening on wlan0, link-type EN10MB (Ethernet), snapshot length 262144 bytes
| 16:50:00.386741 IP 192.168.1.106.48913 > 192.168.1.251.domain: 44552+ A? 1.debian.pool.ntp.org. (39)
| 16:50:00.386835 IP 192.168.1.106.48913 > 192.168.1.251.domain: 59403+ AAAA? 1.debian.pool.ntp.org. (39)
| 16:50:00.397777 IP 192.168.1.106.57667 > 192.168.1.251.domain: 30361+ PTR? 251.1.168.192.in-addr.arpa. (44)
| 16:50:00.437443 IP 192.168.1.109.mdns > 224.0.0.251.mdns: 0 PTR (QM)? _microsoft_mcc._tcp.local. (43)
| ^C
| 4 packets captured
| 414 packets received by filter
| 362 packets dropped by kernel
@end

@analysis
Analisi del traffico catturato:

1. Query DNS di tipo A per "1.debian.pool.ntp.org":
   - Il nostro PC (192.168.1.106) chiede al DNS resolver (192.168.1.251) l'indirizzo IPv4 di un server NTP.
   - NTP (Network Time Protocol, porta 123/UDP): sincronizza l'orologio di sistema.
   - pool.ntp.org e' un cluster di server NTP volontari distribuiti globalmente.
   - Il record A restituisce un indirizzo IPv4.

2. Query DNS di tipo AAAA per lo stesso hostname:
   - AAAA e' il record DNS per indirizzi IPv6 (128 bit = 4 * 32 bit, da cui "AAAA" = 4 volte "A").
   - Il sistema chiede entrambi (A e AAAA) in parallelo: questo e' il comportamento "Happy Eyeballs"
     (RFC 6555) che sceglie la connessione piu' veloce tra IPv4 e IPv6.

3. Query PTR (reverse DNS):
   - Lookup inverso per 192.168.1.251 -> cerca il nome del DNS resolver/router.

4. Query mDNS da 192.168.1.109:
   - "_microsoft_mcc._tcp.local": discovery di un servizio Microsoft sulla rete locale.
   - Il formato _service._proto.local e' definito da DNS-SD (DNS Service Discovery, RFC 6763).
   - Indica un dispositivo Windows (.109) che cerca servizi Microsoft sulla rete.

Anche qui: 362 su 414 pacchetti persi (87% di loss) a causa del buffer ridotto del kernel.
@end

#Ho provato con un collega universitario che ha Windows, sono riuscito a trovarlo con la porta 22, si vede non aveva come password dell'user ubuntu: "ubuntu"

#Il test era concordato: il collega sapeva del tentativo di accesso al suo PC e aveva dato il suo consenso.

@term
$ > ssh ubuntu@192.168.1.104
| The authenticity of host '192.168.1.104 (192.168.1.104)' can't be established.
| ED25519 key fingerprint is SHA256:yHKeMsGbQLpkFk1DaDD19+frxPG08n8DSXzKCmw7jEo.
| This key is not known by any other names.
| Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
| Warning: Permanently added '192.168.1.104' (ED25519) to the list of known hosts.
| (ubuntu@192.168.1.104) Password:
| (ubuntu@192.168.1.104) Password:
| (ubuntu@192.168.1.104) Password:
| ubuntu@192.168.1.104's password:
| Permission denied, please try again.
| ubuntu@192.168.1.104's password:
| Permission denied, please try again.
| ubuntu@192.168.1.104's password:
| Received disconnect from 192.168.1.104 port 22:2: Too many authentication failures
| Disconnected from 192.168.1.104 port 22
@end

@analysis
Connessione alla porta 22 (SSH diretto sul PC del collega, non nel container Docker).

Il tentativo di login fallisce dopo 6 tentativi (3 con metodo keyboard-interactive + 3 con password):

- I primi 3 prompt "(ubuntu@192.168.1.104) Password:" usano il metodo keyboard-interactive
  (pam_authenticate), riconoscibile dalle parentesi nel prompt.
- I successivi "ubuntu@192.168.1.104's password:" usano il metodo password classico.
- "Too many authentication failures": il server SSH ha raggiunto MaxAuthTries (default: 6) e chiude
  la connessione con un messaggio di disconnect (codice 2 = SSH_DISCONNECT_PROTOCOL_ERROR).

La porta 22 aperta direttamente sul PC del collega (non su una porta alta come 20xx) indica che
il collega ha un server SSH installato sul sistema host (es. OpenSSH-Server su Windows via WSL
o installato come feature opzionale), non nel container Docker.

Implicazioni di sicurezza:

- La porta 22 esposta sulla rete WiFi condivisa e' un potenziale vettore di attacco.
- Se la password dell'utente ubuntu e' debole, un attaccante potrebbe eseguire un brute force
  con tool come hydra: \`hydra -l ubuntu -P wordlist.txt ssh://192.168.1.104\`
- Contromisure: usare autenticazione basata su chiavi SSH (disabilitare PasswordAuthentication),
  configurare fail2ban per bloccare IP dopo troppi tentativi, limitare l'accesso con AllowUsers.
@end

# Abbiamo passato gli ultimi minuti di laboratorio tracciando la connessione di www.unipr.it

@term
$ > traceroute 160.78.48.10
| traceroute to 160.78.48.10 (160.78.48.10), 30 hops max, 60 byte packets
|  1  192.168.1.251 (192.168.1.251)  3.724 ms  3.623 ms  3.579 ms
|  2  * * *
|  3  * * *
|  4  * * *
|  5  * * *
|  6  * * *
|  7  * * *
|  8  * * *
|  9  * * *
| 10  * * *
| 11  * * *
| 12  * * *
| 13  * * *
| 14  * * *
| 15  * * *
| 16  * * *
| 17  * * *
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
Traceroute verso 160.78.48.10 (IP del campus UniPR):

Come funziona traceroute:

- Invia pacchetti UDP (Linux) o ICMP (Windows) con TTL (Time To Live) crescente: 1, 2, 3, ...
- Ogni router sul percorso decrementa il TTL di 1. Quando TTL raggiunge 0, il router scarta il
  pacchetto e invia un messaggio ICMP "Time Exceeded" (tipo 11) al mittente.
- traceroute identifica ogni hop dal campo source del messaggio ICMP Time Exceeded ricevuto.

Analisi dell'output:

- Hop 1: 192.168.1.251 (3.7 ms) = il router WiFi del professore (primo hop, gateway della rete locale).
- Hop 2-30: tutti asterischi (***) = nessuna risposta ICMP ricevuta.

Possibili cause degli asterischi (dal hop 2 in poi):

1. Il router dell'AP non inoltra il traffico verso Internet: la rete WiFi del professore e' "isolata",
   potrebbe non avere una connessione upstream verso Internet o verso la rete universitaria.
2. Il router fa NAT ma il firewall upstream blocca ICMP: molti ISP e firewall aziendali droppano
   i pacchetti ICMP Time Exceeded per motivi di sicurezza (information disclosure).
3. Problemi di routing: la rete del professore potrebbe non avere una rotta verso 160.78.0.0/16
   (rete UniPR, AS137 del GARR).
@end

@term
$ > ping 160.78.48.10
| PING 160.78.48.10 (160.78.48.10) 56(84) bytes of data.
| ^C
| --- 160.78.48.10 ping statistics ---
| 24 packets transmitted, 0 received, 100% packet loss, time 23544ms
@end

# 100% packet loss: conferma che la rete WiFi del laboratorio non ha connettivita' verso la rete universitaria (160.78.0.0/16)

@analysis
Ping con 100% packet loss verso 160.78.48.10:

- 24 pacchetti ICMP Echo Request inviati in 23.5 secondi (~1 pacchetto/secondo, default di ping).
- 0 pacchetti ICMP Echo Reply ricevuti: conferma che non c'e' connettivita' bidirezionale.
- 56(84) bytes: 56 byte di payload ICMP + 8 byte header ICMP + 20 byte header IP = 84 byte totali.

La combinazione di traceroute (solo hop 1 visibile) e ping (100% loss) conferma che:

- Il primo hop (router WiFi) e' raggiungibile.
- Il traffico non viene inoltrato oltre il router verso Internet/rete universitaria.
- La rete WiFi del laboratorio e' probabilmente una rete isolata (air-gapped) creata ad hoc
  per l'esercitazione, senza uplink verso Internet. Questo e' una pratica comune in laboratori
  di sicurezza per evitare che il traffico di test (scansioni nmap, ecc.) raggiunga reti esterne.

Nota: "da errori per, probabilmente, un mio problema di configurazione interna del SO" nell'originale
non e' corretto - il problema non e' del SO ma della rete isolata. La configurazione di rete locale
funziona correttamente (hop 1 raggiungibile), manca semplicemente la connettivita' verso l'esterno.
@end
`;export{e as default};
